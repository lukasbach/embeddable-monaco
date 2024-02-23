import * as monaco from 'monaco-editor';
// @ts-ignore
import { parseTmTheme } from "monaco-themes";

const params = new Proxy<any>(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(String(prop)),
});

const send = (obj: any) => window.top?.postMessage({ ...obj, context: params.context }, '*');
const receive = (type: string, cb: (e: any) => void) =>
    window.addEventListener('message', (e) =>
        e.data.type === type && cb(e.data));

const options: monaco.editor.IStandaloneEditorConstructionOptions = {
    value: params.code ?? '',
    language: params.lang ?? 'javascript',
    theme: params.theme ?? 'vs-light',
    contextmenu: params.contextmenu !== 'false',
    folding: params.folding !== 'false',
    readOnly: params.readonly === 'true',
    lineNumbers: params.lineNumbers as any ?? 'on',
    automaticLayout: true,
    minimap: {
        enabled: params.minimap !== 'false',
    },
};

console.log("options are", options);

const editor = monaco.editor.create(document.getElementById('root') ?? document.body, options);

// const customTheme = params.theme && !["vs-light", "vs-dark"].includes(params.theme) ? params.theme : undefined;

const getCustomThemeName = (theme: string | undefined) => {
    return theme && !["vs-light", "vs-dark"].includes(params.theme) ? theme : undefined
}
const getBuiltinTheme = (theme: string | undefined) => {
    return theme && ["vs-light", "vs-dark"].includes(params.theme) ? theme : undefined
}

const loadTheme = async (themeName: string | undefined): Promise<monaco.editor.IStandaloneThemeData> => {
    return themeName ? fetch("/themes/" + themeName + ".json").then(res => res.json()) : Promise.resolve(undefined);
}

const customTheme = getCustomThemeName(params.theme);
if (customTheme) {
    loadTheme(customTheme).then(theme => {
        if (theme) {
            monaco.editor.defineTheme("custom", theme);
            monaco.editor.setTheme("custom");
        }
    });
}

const changeBackground = async (color: string, theme?: string) => {
    const fixedColor = color.startsWith("#") ? color : color === "transparent" ? "#00000000" : "#" + color;
    const customTheme = await loadTheme(getCustomThemeName(theme));
    monaco.editor.defineTheme("custom", {
        base: getBuiltinTheme(theme ?? customTheme.base) ?? 'vs-light' as any,
        inherit: customTheme?.inherit ?? true,
        rules: customTheme?.rules ?? [],
        colors: {
            ...customTheme?.colors,
            "editor.background": fixedColor,
            "editor.gutter.background": fixedColor,
            "minimap.background": fixedColor,
        },
        encodedTokensColors: customTheme?.encodedTokensColors,
    });
    monaco.editor.setTheme("custom");
}

if (params.background) {
    changeBackground(params.background, params.theme);
}

if (params.javascriptDefaults) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: params.javascriptDefaultsNoSemanticValidation === 'true',
        noSyntaxValidation: params.javascriptDefaultsNoSyntaxValidation === 'true',
    });
}

if (params.typescriptDefaults) {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: params.typescriptDefaultsNoSemanticValidation === 'true',
        noSyntaxValidation: params.typescriptDefaultsNoSyntaxValidation === 'true',
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
    changeBackground(e.background, e.theme);
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

send({
    type: 'ready',
});
