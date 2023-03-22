import * as monaco from 'monaco-editor';

const send = (obj: any) => window.top?.postMessage(obj, '*');
const receive = (type: string, cb: (e: any) => void) =>
    window.addEventListener('message', (e) =>
        e.data.type === type && cb(e.data));

const params = new Proxy<any>(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(String(prop)),
});

const options: monaco.editor.IStandaloneEditorConstructionOptions = {
    value: params.code ?? '',
    language: params.lang ?? 'javascript',
    theme: params.theme ?? 'vs-light',
    contextmenu: params.contextmenu !== 'false',
    folding: params.folding !== 'false',
    readOnly: params.readonly === 'true',
    lineNumbers: params.linenumbers as any ?? 'on',
    minimap: {
        enabled: params.minimap !== 'false',
    },
};

console.log("options are", options);

const editor = monaco.editor.create(document.getElementById('root') ?? document.body, options);

if (params.background) {
    monaco.editor.defineTheme("custom", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#" + params.background,
        },
    });
    monaco.editor.setTheme("custom");
}

if (params.javascriptDefaults) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: params.javascriptDefaultsNoSemanticValidation === 'true',
        noSyntaxValidation: params.javascriptDefaultsNoSyntaxValidation === 'true',
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
    });
}

if (params.typescriptDefaults) {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: params.typescriptDefaultsNoSemanticValidation === 'true',
        noSyntaxValidation: params.typescriptDefaultsNoSyntaxValidation === 'true',
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2015,
    });
}

editor.onDidChangeModelContent((e) => {
    send({
        type: 'change',
        value: params.dontPostValueOnChange ? null : editor.getModel()?.getValue(),
        e,
    });
});

receive('change-options', e => {
    editor.updateOptions(e.options);
});

receive('change-value', e => {
    editor.setValue(e.value);
});

receive('change-theme', e => {
    monaco.editor.setTheme(e.theme);
});

receive('change-language', e => {
    monaco.editor.setModelLanguage(editor.getModel()!, e.language);
});

receive('change-background', e => {
    monaco.editor.defineTheme("custom", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": e.background,
        },
    });
    monaco.editor.setTheme("custom");
});

receive('get-content', () => {
    send({
        type: 'content',
        value: editor.getModel()?.getValue(),
    });
});

receive('change-javascript-defaults', e => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(e.diagnosticsOptions);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(e.compilerOptions);
});

receive('change-typescript-defaults', e => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(e.diagnosticsOptions);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(e.compilerOptions);
});
