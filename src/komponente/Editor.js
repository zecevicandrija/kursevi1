import Editor from '@monaco-editor/react';

// U JSX-u zamenite react-simple-code-editor sa:
<Editor
    height="300px"
    language={language}
    theme="vs-dark"
    value={code}
    onChange={(newValue) => setCode(newValue)}
    options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on'
    }}
/>