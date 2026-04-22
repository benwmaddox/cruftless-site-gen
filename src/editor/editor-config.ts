import { componentTypeNames } from "../components/index.js";
import { componentEditorRegistry } from "../editors/component-editors.js";
import { themeNames } from "../themes/index.js";
import { themeTokenNames } from "../themes/tokens.js";

const serializeEditor = (editor: (typeof componentEditorRegistry)[keyof typeof componentEditorRegistry]) => ({
  kind: editor.kind,
  type: editor.type,
  title: editor.title,
  defaults: editor.defaults,
  fields: editor.fields,
});

export const editorConfig = {
  componentSpecs: Object.fromEntries(
    Object.entries(componentEditorRegistry).map(([type, editor]) => [type, serializeEditor(editor)]),
  ),
  componentTypes: componentTypeNames,
  themes: themeNames,
  themeTokens: themeTokenNames,
};
