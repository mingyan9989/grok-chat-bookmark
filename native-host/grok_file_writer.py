#!/usr/bin/env python3
"""
Native messaging host for Grok Bookmark extension.

Actions:
  - ping
  - pick_folder
  - write_file
  - call_claude
"""

import glob
import json
import os
import platform
import struct
import subprocess
import sys


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) < 4:
        return None
    length = struct.unpack('<I', raw_length)[0]
    if length > 1024 * 1024:
        return None
    raw = sys.stdin.buffer.read(length)
    return json.loads(raw.decode('utf-8'))


def send_message(msg):
    encoded = json.dumps(msg, ensure_ascii=False).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def pick_folder():
    if platform.system() != 'Darwin':
        return {'success': False, 'error': f'Folder picker only supported on macOS'}

    try:
        proc = subprocess.run(
            ['osascript', '-e', 'POSIX path of (choose folder with prompt "Select save directory")'],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            path = proc.stdout.strip().rstrip('/')
            return {'success': True, 'path': path, 'name': os.path.basename(path)}
        return {'success': False, 'error': 'cancelled'}
    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'timeout'}
    except Exception as exc:
        return {'success': False, 'error': str(exc)}


def validate_path(file_path):
    if '\x00' in file_path:
        return None, 'path contains null byte'

    parts = file_path.replace('\\', '/').split('/')
    if '..' in parts:
        return None, 'path contains ..'

    expanded = os.path.expanduser(file_path)
    resolved = os.path.realpath(expanded)

    home = os.path.expanduser('~')
    if not resolved.startswith(home + os.sep) and resolved != home:
        return None, 'path is outside home directory'

    return resolved, None


def write_file(file_path, content):
    try:
        resolved, err = validate_path(file_path)
        if err:
            return {'success': False, 'error': err}

        dir_path = os.path.dirname(resolved)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)

        base, ext = os.path.splitext(resolved)
        final = resolved
        counter = 0
        while os.path.exists(final) and counter < 100:
            counter += 1
            final = f'{base} ({counter}){ext}'

        with open(final, 'w', encoding='utf-8') as handle:
            handle.write(content)

        return {'success': True, 'path': final}
    except Exception as exc:
        return {'success': False, 'error': str(exc)}


def find_claude():
    import shutil

    path = shutil.which('claude')
    if path:
        return path

    home = os.path.expanduser('~')
    candidates = [
        '/usr/local/bin/claude',
        '/usr/bin/claude',
        '/opt/homebrew/bin/claude',
        f'{home}/.nvm/versions/node/*/bin/claude',
        f'{home}/.npm-global/bin/claude',
        f'{home}/.local/bin/claude',
    ]
    for pattern in candidates:
        matches = glob.glob(pattern)
        if matches:
            return sorted(matches)[-1]
    return None


def build_env_with_node(claude_bin):
    env = os.environ.copy()
    env.pop('CLAUDECODE', None)
    claude_dir = os.path.dirname(claude_bin)
    existing = env.get('PATH', '')
    env['PATH'] = claude_dir + (':' + existing if existing else '')
    return env


def call_claude(system, user):
    claude_bin = find_claude()
    if not claude_bin:
        return {
            'success': False,
            'error': 'claude CLI not found. Install: npm install -g @anthropic-ai/claude-code',
        }

    prompt = (system + '\n\n' + user) if system else user
    try:
        result = subprocess.run(
            [claude_bin, '-p', prompt, '--output-format', 'text'],
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=120,
            env=build_env_with_node(claude_bin),
        )
        if result.returncode != 0:
            err = result.stderr.strip() or f'exit code {result.returncode}'
            return {'success': False, 'error': err}
        return {'success': True, 'text': result.stdout.strip()}
    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'timeout (120s)'}
    except Exception as exc:
        return {'success': False, 'error': str(exc)}


def main():
    message = read_message()
    if not message:
        return

    action = message.get('action', '')

    if action == 'ping':
        send_message({'success': True, 'version': '0.1.0'})
    elif action == 'pick_folder':
        send_message(pick_folder())
    elif action == 'write_file':
        path = message.get('path', '')
        content = message.get('content', '')
        if not path:
            send_message({'success': False, 'error': 'missing path'})
        else:
            send_message(write_file(path, content))
    elif action == 'call_claude':
        send_message(call_claude(message.get('system', ''), message.get('user', '')))
    else:
        send_message({'success': False, 'error': f'unknown action: {action}'})


if __name__ == '__main__':
    main()
