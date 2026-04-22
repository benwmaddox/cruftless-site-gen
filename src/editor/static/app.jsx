import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const clone = (value) => JSON.parse(JSON.stringify(value));

const getAtPath = (root, path) =>
  path.reduce((value, segment) => (value == null ? undefined : value[segment]), root);

const setAtPath = (root, path, value) => {
  const nextRoot = clone(root);
  let cursor = nextRoot;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    if (cursor[segment] == null) {
      cursor[segment] = typeof path[index + 1] === "number" ? [] : {};
    }
    cursor = cursor[segment];
  }

  const last = path[path.length - 1];
  if (value === undefined) {
    delete cursor[last];
  } else {
    cursor[last] = value;
  }

  return nextRoot;
};

const moveItem = (items, fromIndex, toIndex) => {
  const nextItems = [...items];
  nextItems.splice(toIndex, 0, nextItems.splice(fromIndex, 1)[0]);
  return nextItems;
};

class HttpError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "HttpError";
    this.issues = Array.isArray(issues) ? issues : [];
  }
}

const pathKey = (path) => JSON.stringify(path);

const issuesToMap = (issues) => {
  const map = new Map();

  for (const issue of Array.isArray(issues) ? issues : []) {
    const key = pathKey(issue.path ?? []);
    const nextIssues = map.get(key) ?? [];
    nextIssues.push(issue.message);
    map.set(key, nextIssues);
  }

  return map;
};

const postJson = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    let issues = [];

    try {
      const payload = JSON.parse(text);
      message = payload.error ?? text;
      issues = payload.issues ?? [];
    } catch {
      message = text;
    }

    throw new HttpError(message || `${response.status} ${response.statusText}`, issues);
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
};

const fieldLabel = (field) => `${field.label}${field.optional ? " (optional)" : ""}`;

const normalizeFieldValue = (field, value) => {
  if (field.optional && (value === "" || value === null || Number.isNaN(value))) {
    return undefined;
  }

  return value;
};

const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

const toContentAssetHref = (value) => {
  const trimmedValue = String(value ?? "").trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^https?:\/\//iu.test(trimmedValue) || trimmedValue.startsWith("//")) {
    return trimmedValue;
  }

  const normalizedValue = trimmedValue.replaceAll("\\", "/");

  if (normalizedValue.startsWith("/content/")) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith("content/")) {
    return `/${normalizedValue}`;
  }

  if (normalizedValue.startsWith("/")) {
    return normalizedValue;
  }

  return `/content/${normalizedValue.replace(/^\/+/u, "")}`;
};

const isPreviewableImageHref = (value) => {
  const href = toContentAssetHref(value);

  if (!href || /^data:/iu.test(href)) {
    return false;
  }

  const pathname = href.startsWith("http")
    ? new URL(href).pathname
    : href.split("?")[0] ?? href;
  const extensionIndex = pathname.lastIndexOf(".");

  if (extensionIndex < 0) {
    return false;
  }

  return imageExtensions.has(pathname.slice(extensionIndex).toLowerCase());
};

const MediaSourceField = ({ browser, errors, field, update, value }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const previewHref = isPreviewableImageHref(value) ? toContentAssetHref(value) : "";

  const loadMediaFiles = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const params = new URLSearchParams({ directory: browser.directory });
      const payload = await fetch(`/__editor/media?${params.toString()}`);

      if (!payload.ok) {
        throw new Error(await payload.text());
      }

      const nextListing = await payload.json();
      setMediaFiles(nextListing.files ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }

    void loadMediaFiles();
  }, [pickerOpen, browser.directory]);

  return (
    <div className="field">
      <label>{fieldLabel(field)}</label>
      <input
        data-testid={`field-${field.key}`}
        type="text"
        value={value ?? ""}
        onChange={(event) => update(event.currentTarget.value)}
      />
      {errors.map((error) => (
        <div className="field-error" key={error}>{error}</div>
      ))}
      <div className="row">
        <button type="button" onClick={() => setPickerOpen((open) => !open)}>
          {pickerOpen ? "Hide media" : "Pick media"}
        </button>
      </div>
      {previewHref ? (
        <div className="media-preview-card">
          <img alt="" className="media-preview-image" src={previewHref} />
          <div className="hint">{previewHref}</div>
        </div>
      ) : null}
      {pickerOpen ? (
        <div className="media-picker">
          {loading ? <div className="hint">Loading media…</div> : null}
          {loadError ? <div className="hint">{loadError}</div> : null}
          {!loading && !loadError && mediaFiles.length === 0 ? (
            <div className="hint">No media files found in this folder or its subdirectories.</div>
          ) : null}
          {!loading && !loadError ? (
            <div className="media-picker-list">
              {mediaFiles.map((file) => (
                <button
                  key={file.path}
                  className="media-picker-item"
                  type="button"
                  onClick={() => {
                    update(file.href);
                    setPickerOpen(false);
                  }}
                >
                  {file.kind === "image" ? (
                    <img alt="" className="media-picker-thumb" src={file.href} />
                  ) : (
                    <div className="media-picker-thumb media-picker-thumb-placeholder">{file.kind}</div>
                  )}
                  <div className="media-picker-meta">
                    <div className="media-picker-name">{file.relativePath}</div>
                    <div className="hint">{file.href}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const FieldRenderer = ({ browser, draft, field, path, setDraft, refreshPreview, validationErrors }) => {
  const value = getAtPath(draft, path);
  const fieldErrors = validationErrors.get(pathKey(path)) ?? [];

  const update = (nextValue) => {
    setDraft((currentDraft) =>
      setAtPath(currentDraft, path, normalizeFieldValue(field, nextValue)),
    );
    refreshPreview();
  };

  if (field.kind === "readonly") {
    return null;
  }

  if (field.kind === "media") {
    return (
      <MediaSourceField
        browser={browser}
        errors={fieldErrors}
        field={field}
        update={update}
        value={value}
      />
    );
  }

  if (field.kind === "text" || field.kind === "number") {
    return (
      <div className="field">
        <label>{fieldLabel(field)}</label>
        <input
          data-testid={`field-${field.key}`}
          type={field.kind === "number" ? "number" : "text"}
          value={value ?? ""}
          onChange={(event) => {
            const nextValue =
              field.kind === "number" && event.currentTarget.value !== ""
                ? Number(event.currentTarget.value)
                : event.currentTarget.value;
            update(nextValue);
          }}
        />
        {fieldErrors.map((error) => (
          <div className="field-error" key={error}>{error}</div>
        ))}
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div className="field">
        <label>{fieldLabel(field)}</label>
        <textarea
          data-testid={`field-${field.key}`}
          value={value ?? ""}
          onChange={(event) => update(event.currentTarget.value)}
        />
        {fieldErrors.map((error) => (
          <div className="field-error" key={error}>{error}</div>
        ))}
      </div>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <div className="field">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => update(field.optional && !event.currentTarget.checked ? undefined : event.currentTarget.checked)}
          />
          <span>{fieldLabel(field)}</span>
        </label>
        {fieldErrors.map((error) => (
          <div className="field-error" key={error}>{error}</div>
        ))}
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div className="field">
        <label>{fieldLabel(field)}</label>
        <select
          data-testid={`field-${field.key}`}
          value={value ?? ""}
          onChange={(event) => update(event.currentTarget.value)}
        >
          {field.optional ? <option value="">None</option> : null}
          {(field.options ?? []).map((option) => {
            const optionValue = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            return (
              <option key={optionValue} value={optionValue}>
                {label}
              </option>
            );
          })}
        </select>
        {fieldErrors.map((error) => (
          <div className="field-error" key={error}>{error}</div>
        ))}
      </div>
    );
  }

  if (field.kind === "string-list") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="field-group">
        <div className="list-item-header">
          <h3>{field.label}</h3>
          <button
            type="button"
            onClick={() => update([...items, field.createItem ?? ""])}
          >
            Add
          </button>
        </div>
        <div className="list-stack">
          {items.map((item, index) => (
            <div className="row" key={index}>
              <textarea
                className="grow"
                data-testid={`field-${field.key}-${index}`}
                value={item}
                onChange={(event) => {
                  const nextItems = [...items];
                  nextItems[index] = event.currentTarget.value;
                  update(nextItems);
                }}
              />
              <button
                className="danger"
                type="button"
                onClick={() => update(items.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (field.kind === "object") {
    const objectValue = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return (
      <div className="field-group">
        <h3>{field.label}</h3>
        <div className="form-grid">
          {field.fields.map((childField) => (
            <FieldRenderer
              browser={browser}
              key={childField.key}
              draft={draft}
              field={childField}
              path={[...path, childField.key]}
              setDraft={setDraft}
              refreshPreview={refreshPreview}
              validationErrors={validationErrors}
            />
          ))}
        </div>
        {objectValue === value ? null : <span hidden>{JSON.stringify(objectValue)}</span>}
      </div>
    );
  }

  if (field.kind === "optional-object") {
    const enabled = Boolean(value);
    return (
      <div className="field-group">
        <label className="field-inline">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => update(event.currentTarget.checked ? clone(field.createValue) : undefined)}
          />
          <span>{field.label}</span>
        </label>
        {enabled ? (
          <div className="form-grid">
            {field.fields.map((childField) => (
              <FieldRenderer
                browser={browser}
                key={childField.key}
                draft={draft}
                field={childField}
                path={[...path, childField.key]}
                setDraft={setDraft}
                refreshPreview={refreshPreview}
                validationErrors={validationErrors}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (field.kind === "object-list") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="field-group">
        <div className="list-item-header">
          <h3>{field.label}</h3>
          <button type="button" onClick={() => update([...items, clone(field.createItem)])}>
            Add
          </button>
        </div>
        {items.length === 0 ? <div className="empty-state">No items yet.</div> : null}
        <div className="list-stack">
          {items.map((item, index) => (
            <div className="list-item" key={index}>
              <div className="list-item-header">
                <div className="list-item-title">
                  {index + 1}. {item[field.itemLabelKey] ?? "Item"}
                </div>
                <div className="row">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => update(moveItem(items, index, index - 1))}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => update(moveItem(items, index, index + 1))}
                  >
                    Down
                  </button>
                  <button
                    className="danger"
                    type="button"
                    onClick={() => update(items.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="form-grid">
                {field.fields.map((childField) => (
                  <FieldRenderer
                    browser={browser}
                    key={childField.key}
                    draft={draft}
                    field={childField}
                    path={[...path, index, childField.key]}
                    setDraft={setDraft}
                    refreshPreview={refreshPreview}
                    validationErrors={validationErrors}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="empty-state">Unsupported field {field.kind}</div>;
};

const SectionRenderer = ({
  basePath,
  browser,
  draft,
  refreshPreview,
  section,
  setDraft,
  validationErrors,
}) => (
  <div className="field-group">
    <h3>{section.title}</h3>
    <div className="form-grid">
      {section.fields.map((field) => (
        <FieldRenderer
          browser={browser}
          key={field.key}
          draft={draft}
          field={field}
          path={[...basePath, field.key]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
          validationErrors={validationErrors}
        />
      ))}
    </div>
  </div>
);

const SiteEditor = ({ browser, config, draft, refreshPreview, setDraft, validationErrors }) => {
  const sitePath = ["site"];
  const updateSiteField = (key, value) => {
    setDraft((currentDraft) => setAtPath(currentDraft, [...sitePath, key], value || undefined));
    refreshPreview();
  };

  const enableSharedLayout = () => {
    setDraft((currentDraft) =>
      setAtPath(currentDraft, [...sitePath, "layout"], {
        components: [{ type: "page-content" }],
      }),
    );
    refreshPreview();
  };

  return (
    <>
      <div className="card">
        <h2>Site</h2>
        <div className="form-grid">
          <FieldRenderer
            browser={browser}
            draft={draft}
            field={{ kind: "text", key: "name", label: "Name" }}
            path={[...sitePath, "name"]}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
          <FieldRenderer
            browser={browser}
            draft={draft}
            field={{ kind: "text", key: "baseUrl", label: "Base URL" }}
            path={[...sitePath, "baseUrl"]}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
          <div className="field">
            <label>Theme</label>
            <select
              data-testid="field-theme"
              value={draft.site.theme}
              onChange={(event) => updateSiteField("theme", event.currentTarget.value)}
            >
              {config.themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
          <FieldRenderer
            browser={browser}
            draft={draft}
            field={{
              kind: "media",
              key: "pageBackgroundImageUrl",
              label: "Page background image",
              optional: true,
            }}
            path={[...sitePath, "pageBackgroundImageUrl"]}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
          <FieldRenderer
            browser={browser}
            draft={draft}
            field={{
              kind: "text",
              key: "googleAnalyticsMeasurementId",
              label: "Google Analytics measurement ID",
              optional: true,
            }}
            path={[...sitePath, "googleAnalyticsMeasurementId"]}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
        </div>
      </div>
      {draft.site.layout?.components ? (
        <ComponentListEditor
          browser={browser}
          config={config}
          draft={draft}
          components={draft.site.layout.components}
          componentsPath={["site", "layout", "components"]}
          mode="layout"
          setDraft={setDraft}
          refreshPreview={refreshPreview}
          title="Shared Layout Components"
          validationErrors={validationErrors}
        />
      ) : (
        <div className="card">
          <div className="list-item-header">
            <h2>Shared Layout Components</h2>
            <button type="button" onClick={enableSharedLayout}>
              Add Shared Layout
            </button>
          </div>
          <div className="hint">No shared layout is configured for this site.</div>
        </div>
      )}
    </>
  );
};

const PageEditor = ({
  browser,
  draft,
  page,
  pageIndex,
  validationErrors,
  setDraft,
  setSelectedPageIndex,
  refreshPreview,
}) => {
  const updatePage = (updater) => {
    setDraft((currentDraft) => {
      const nextDraft = clone(currentDraft);
      updater(nextDraft);
      return nextDraft;
    });
    refreshPreview();
  };

  return (
    <div className="card">
      <div className="list-item-header">
        <h2>Page</h2>
        <div className="row">
          <button
            type="button"
            onClick={() => {
              const slugs = new Set(draft.pages.map((candidate) => candidate.slug));
              let nextIndex = draft.pages.length + 1;
              let slug = `/new-page-${nextIndex}`;
              while (slugs.has(slug)) {
                nextIndex += 1;
                slug = `/new-page-${nextIndex}`;
              }
              updatePage((nextDraft) => {
                const copy = clone(page);
                copy.slug = slug;
                copy.title = `${copy.title} Copy`;
                nextDraft.pages.splice(pageIndex + 1, 0, copy);
              });
              setSelectedPageIndex(pageIndex + 1);
            }}
          >
            Duplicate
          </button>
          <button
            className="danger"
            type="button"
            onClick={() => {
              if (draft.pages.length <= 1) {
                return;
              }
              updatePage((nextDraft) => {
                nextDraft.pages.splice(pageIndex, 1);
              });
              setSelectedPageIndex(Math.max(0, pageIndex - 1));
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="form-grid">
        <FieldRenderer
          browser={browser}
          draft={draft}
          field={{ kind: "text", key: "slug", label: "Slug" }}
          path={["pages", pageIndex, "slug"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
          validationErrors={validationErrors}
        />
        <FieldRenderer
          browser={browser}
          draft={draft}
          field={{ kind: "text", key: "title", label: "Title" }}
          path={["pages", pageIndex, "title"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
          validationErrors={validationErrors}
        />
        <div className="field-group">
          <h3>Metadata</h3>
          <div className="form-grid">
            {["description", "canonicalUrl", "socialImageUrl"].map((key) => (
              <FieldRenderer
                browser={browser}
                key={key}
                draft={draft}
                field={{
                  kind: key === "description" ? "textarea" : key === "socialImageUrl" ? "media" : "text",
                  key,
                  label: key,
                  optional: true,
                }}
                path={["pages", pageIndex, "metadata", key]}
                setDraft={setDraft}
                refreshPreview={refreshPreview}
                validationErrors={validationErrors}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ComponentEditor = ({
  browser,
  config,
  draft,
  component,
  componentCount,
  componentIndex,
  componentsPath,
  mode,
  setDraft,
  refreshPreview,
  validationErrors,
}) => {
  const editor = config.componentSpecs[component.type];

  const updateComponents = (updater) => {
    setDraft((currentDraft) => {
      const nextDraft = clone(currentDraft);
      updater(getAtPath(nextDraft, componentsPath));
      return nextDraft;
    });
    refreshPreview();
  };

  if (component.type === "page-content") {
    return (
      <div className="card">
        <div className="list-item-header">
          <h2>Page Content Slot</h2>
          <div className="row">
            <button
              type="button"
              disabled={componentIndex === 0}
              onClick={() => {
                updateComponents((components) => {
                  const moved = moveItem(components, componentIndex, componentIndex - 1);
                  components.splice(0, components.length, ...moved);
                });
              }}
            >
              Up
            </button>
            <button
              type="button"
              disabled={componentIndex === componentCount - 1}
              onClick={() => {
                updateComponents((components) => {
                  const moved = moveItem(components, componentIndex, componentIndex + 1);
                  components.splice(0, components.length, ...moved);
                });
              }}
            >
              Down
            </button>
            <button
              className="danger"
              type="button"
              disabled={componentCount <= 1}
              onClick={() => {
                updateComponents((components) => {
                  components.splice(componentIndex, 1);
                });
              }}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="hint">This is where each page's own components render inside the shared layout.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="list-item-header">
        <h2>{editor?.title ?? component.type}</h2>
        <div className="row">
          <button
            type="button"
            disabled={componentIndex === 0}
            onClick={() => {
              updateComponents((components) => {
                const moved = moveItem(components, componentIndex, componentIndex - 1);
                components.splice(0, components.length, ...moved);
              });
            }}
          >
            Up
          </button>
          <button
            type="button"
            disabled={componentIndex === componentCount - 1}
            onClick={() => {
              updateComponents((components) => {
                const moved = moveItem(components, componentIndex, componentIndex + 1);
                components.splice(0, components.length, ...moved);
              });
            }}
          >
            Down
          </button>
          <button
            type="button"
            onClick={() => {
              updateComponents((components) => {
                components.splice(componentIndex + 1, 0, clone(component));
              });
            }}
          >
            Duplicate
          </button>
          <button
            className="danger"
            type="button"
            onClick={() => {
              if (componentCount <= 1) {
                return;
              }
              updateComponents((components) => {
                components.splice(componentIndex, 1);
              });
            }}
          >
            Delete
          </button>
        </div>
      </div>
      {editor ? (
        editor.fields.map((section) => (
          <SectionRenderer
            browser={browser}
            key={section.title}
            draft={draft}
            section={section}
            basePath={[...componentsPath, componentIndex]}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
        ))
      ) : (
        <div className="empty-state">No editor exists for this component type.</div>
      )}
    </div>
  );
};

const ComponentListEditor = ({
  browser,
  config,
  draft,
  components,
  componentsPath,
  mode,
  setDraft,
  refreshPreview,
  title,
  validationErrors,
}) => {
  const componentTypeRef = useRef(null);
  const componentTypeOptions =
    mode === "layout" ? ["page-content", ...config.componentTypes] : config.componentTypes;

  const addComponent = () => {
    const componentType = componentTypeRef.current?.value ?? "prose";
    const nextComponent =
      componentType === "page-content"
        ? { type: "page-content" }
        : clone(config.componentSpecs[componentType].defaults);

    setDraft((currentDraft) => {
      const nextDraft = clone(currentDraft);
      getAtPath(nextDraft, componentsPath).push(nextComponent);
      return nextDraft;
    });
    refreshPreview();
  };

  return (
    <div className="component-scope">
      <div className="list-item-header">
        <h2>{title}</h2>
        <div className="component-add-row">
          <div className="grow">
            <select ref={componentTypeRef} defaultValue={mode === "layout" ? "page-content" : "prose"}>
              {componentTypeOptions.map((componentType) => (
                <option key={componentType} value={componentType}>
                  {componentType === "page-content"
                    ? "Page Content Slot"
                    : config.componentSpecs[componentType].title}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={addComponent}>
            Add Component
          </button>
        </div>
      </div>
      <div className="list-stack">
        {components.map((component, componentIndex) => (
          <ComponentEditor
            browser={browser}
            key={`${component.type}-${componentIndex}`}
            config={config}
            draft={draft}
            component={component}
            componentCount={components.length}
            componentIndex={componentIndex}
            componentsPath={componentsPath}
            mode={mode}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
        ))}
      </div>
    </div>
  );
};

const PageScopeEditor = ({
  browser,
  config,
  draft,
  page,
  pageIndex,
  setDraft,
  setSelectedScope,
  refreshPreview,
  validationErrors,
}) => {
  const addPage = () => {
    const slugs = new Set(draft.pages.map((candidate) => candidate.slug));
    let index = draft.pages.length + 1;
    let slug = `/new-page-${index}`;

    while (slugs.has(slug)) {
      index += 1;
      slug = `/new-page-${index}`;
    }

    setDraft((currentDraft) => {
      const nextDraft = clone(currentDraft);
      nextDraft.pages.push({
        slug,
        title: "New Page",
        components: [clone(config.componentSpecs.prose.defaults)],
      });
      return nextDraft;
    });
    setSelectedScope({ type: "page", pageIndex: draft.pages.length });
    refreshPreview();
  };

  return (
    <>
      <PageEditor
        browser={browser}
        draft={draft}
        page={page}
        pageIndex={pageIndex}
        validationErrors={validationErrors}
        setDraft={setDraft}
        setSelectedPageIndex={(nextPageIndex) =>
          setSelectedScope({ type: "page", pageIndex: nextPageIndex })
        }
        refreshPreview={refreshPreview}
      />
      <ComponentListEditor
        browser={browser}
        config={config}
        draft={draft}
        components={page.components}
        componentsPath={["pages", pageIndex, "components"]}
        mode="page"
        setDraft={setDraft}
        refreshPreview={refreshPreview}
        title="Components"
        validationErrors={validationErrors}
      />
      <div className="card">
        <div className="list-item-header">
          <h2>Pages</h2>
          <button type="button" onClick={addPage}>
            Add Page
          </button>
        </div>
      </div>
    </>
  );
};

const Sidebar = ({
  browser,
  dirty,
  draft,
  openDirectory,
  openFile,
  selectedScope,
  selectedFile,
  setSelectedScope,
  showScope,
}) => {
  const [folderPath, setFolderPath] = useState(browser.directory);
  const [pickerOpen, setPickerOpen] = useState(false);
  const currentFileLabel = selectedFile.split(/[/\\]/u).pop() || selectedFile;

  useEffect(() => {
    setFolderPath(browser.directory);
  }, [browser.directory]);

  return (
    <aside className="sidebar">
      <div className="brand">Cruftless Editor</div>
      <div className="section-title">Site File</div>
      <div className="picker-summary">
        <div className="picker-summary-title" title={selectedFile}>
          {currentFileLabel}
        </div>
        <div className="hint" title={browser.directory}>
          {browser.directory}
        </div>
        <button type="button" onClick={() => setPickerOpen((open) => !open)}>
          {pickerOpen ? "Hide picker" : "Change site"}
        </button>
      </div>
      {pickerOpen ? (
        <>
          <div className="section-title">Folder</div>
          <form
            className="path-picker"
            onSubmit={(event) => {
              event.preventDefault();
              void openDirectory(folderPath, "direct");
            }}
          >
            <input
              aria-label="Project or content path"
              className="folder-path"
              value={folderPath}
              onChange={(event) => setFolderPath(event.currentTarget.value)}
            />
            <button type="submit">Go</button>
          </form>
          <div className="nav-list">
            {browser.parentDirectory ? (
              <button
                type="button"
                className="nav-item"
                onClick={() => void openDirectory(browser.parentDirectory, "none")}
              >
                Up one folder
              </button>
            ) : null}
            {browser.directories.map((directory) => (
              <button
                key={directory.path}
                type="button"
                className="nav-item"
                onClick={() => void openDirectory(directory.path, directory.snapToContent ? "nested" : "none")}
              >
                [dir] {directory.name}
              </button>
            ))}
          </div>
          <div className="section-title">JSON Files</div>
          <div className="nav-list">
            {browser.files.length === 0 ? <div className="hint">No JSON files in this folder.</div> : null}
            {browser.files.map((file) => (
              <button
                key={file.path}
                type="button"
                className={`nav-item ${selectedFile === file.path ? "active" : ""} ${file.valid ? "" : "invalid"}`}
                onClick={async () => {
                  if (!file.valid) {
                    window.alert(file.error ?? "This JSON file is not valid site content.");
                    return;
                  }
                  if (dirty && !window.confirm("Discard unsaved draft changes?")) {
                    return;
                  }
                  await openFile(file.path);
                  setPickerOpen(false);
                }}
                title={file.path}
              >
                {file.siteName ?? file.name}
                {file.valid ? "" : " (invalid)"}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="section-title">Edit</div>
      <div className="nav-list">
        <button
          type="button"
          className={`nav-item ${selectedScope.type === "site" ? "active" : ""}`}
          onClick={() => {
            setSelectedScope({ type: "site" });
            showScope({ type: "site" });
          }}
        >
          Site details
        </button>
      </div>
      <div className="section-title">Pages</div>
      <div className="nav-list">
        {draft.pages.map((page, index) => (
          <button
            key={`${page.slug}-${index}`}
            type="button"
            className={`nav-item ${
              selectedScope.type === "page" && selectedScope.pageIndex === index ? "active" : ""
            }`}
            onClick={() => {
              const nextScope = { type: "page", pageIndex: index };
              setSelectedScope(nextScope);
              showScope(nextScope);
            }}
          >
            {index + 1}. {page.title || page.slug}
          </button>
        ))}
      </div>
    </aside>
  );
};

const RawEditor = ({ draft, setDraft, refreshPreview }) => {
  const [rawJson, setRawJson] = useState(() => JSON.stringify(draft, null, 2));

  useEffect(() => {
    setRawJson(JSON.stringify(draft, null, 2));
  }, [draft]);

  return (
    <div className="card">
      <div className="list-item-header">
        <h2>Raw JSON</h2>
        <button
          className="primary"
          type="button"
          onClick={() => {
            try {
              setDraft(JSON.parse(rawJson));
              refreshPreview();
            } catch (error) {
              window.alert(error instanceof Error ? error.message : String(error));
            }
          }}
        >
          Apply JSON
        </button>
      </div>
      <textarea
        className="raw-json"
        data-testid="raw-json"
        spellCheck="false"
        value={rawJson}
        onChange={(event) => setRawJson(event.currentTarget.value)}
      />
    </div>
  );
};

const App = () => {
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [browser, setBrowser] = useState(null);
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedScope, setSelectedScope] = useState({ type: "site" });
  const [dirty, setDirty] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState(() => new Map());
  const [status, setStatus] = useState("Loading editor...");
  const [statusKind, setStatusKind] = useState("info");
  const [previewVersion, setPreviewVersion] = useState(0);
  const updateTimer = useRef(0);
  const hasLoaded = useRef(false);

  const selectedPage =
    selectedScope.type === "page" ? draft?.pages[selectedScope.pageIndex] : undefined;
  const previewSlug = selectedScope.type === "page" ? (selectedPage?.slug ?? "/") : "/";
  const previewSrc = useMemo(
    () => `/__preview/page?slug=${encodeURIComponent(previewSlug)}&v=${previewVersion}`,
    [previewSlug, previewVersion],
  );

  const setStatusMessage = (message, kind = "info") => {
    setStatus(message);
    setStatusKind(kind);
  };

  const refreshPreview = () => {
    setDirty(true);
  };

  const showScope = (scope) => {
    setPreviewVersion(Date.now());
    if (scope.type === "page") {
      return;
    }
  };

  const refreshBrowser = async () => {
    const response = await fetch("/__editor/files");
    const payload = await response.json();
    setBrowser(payload);
    setSelectedFile(payload.selectedFile);
  };

  const openFile = async (filePath) => {
    setStatusMessage(`Opening ${filePath}...`);
    const payload = await postJson("/__editor/open", { path: filePath });
    setDraft(payload.draft);
    setSelectedFile(payload.path);
    setBrowser(payload.browser);
    setSelectedScope({ type: "site" });
    setDirty(false);
    setValidationErrors(new Map());
    setStatusMessage(`Opened ${payload.name}.`);
    setPreviewVersion(Date.now());
  };

  const openDirectory = async (directoryPath, snapToContent = "none") => {
    setStatusMessage(`Browsing ${directoryPath}...`);

    try {
      const payload = await postJson("/__editor/open-directory", {
        path: directoryPath,
        snapToContent,
      });
      setBrowser(payload);
      setStatusMessage(`Browsing ${payload.directory}.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error), "error");
    }
  };

  const saveDraft = async () => {
    window.clearTimeout(updateTimer.current);
    setStatusMessage("Saving...");

    try {
      await postJson("/__editor/save", draft);
      setDirty(false);
      setValidationErrors(new Map());
      setStatusMessage(`Saved ${selectedFile}.`);
      await refreshBrowser();
    } catch (error) {
      setValidationErrors(issuesToMap(error.issues));
      setStatusMessage(error instanceof Error ? error.message : String(error), "error");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [configResponse, browserResponse] = await Promise.all([
          fetch("/__editor/config"),
          fetch("/__editor/files"),
        ]);
        const nextConfig = await configResponse.json();
        const filePayload = await browserResponse.json();
        setConfig(nextConfig);
        setBrowser(filePayload);
        setSelectedFile(filePayload.selectedFile);
        await openFile(filePayload.selectedFile);
        hasLoaded.current = true;
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : String(error), "error");
      }
    };

    void init();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey)
        && !event.altKey
        && String(event.key).toLowerCase() === "s"
      ) {
        event.preventDefault();
        void saveDraft();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveDraft]);

  useEffect(() => {
    if (!hasLoaded.current || !dirty || !draft) {
      return;
    }

    window.clearTimeout(updateTimer.current);
    setStatusMessage("Updating preview...");
    updateTimer.current = window.setTimeout(async () => {
      try {
        await postJson("/__preview/draft", draft);
        setValidationErrors(new Map());
        setStatusMessage("Draft preview updated.");
      } catch (error) {
        setValidationErrors(issuesToMap(error.issues));
        setStatusMessage(error instanceof Error ? error.message : String(error), "error");
      }
    }, 100);

    return () => window.clearTimeout(updateTimer.current);
  }, [draft, dirty]);

  if (!config || !draft || !browser) {
    return <div className="card">{status}</div>;
  }

  return (
    <div className="editor-layout">
      <Sidebar
        browser={browser}
        dirty={dirty}
        draft={draft}
        openDirectory={openDirectory}
        openFile={openFile}
        selectedScope={selectedScope}
        selectedFile={selectedFile}
        setSelectedScope={setSelectedScope}
        showScope={showScope}
      />
      <main className="editor-panel">
        <div className="topbar">
          <div
            className={`status ${statusKind === "error" ? "error" : ""}`}
            data-role="status"
          >
            {status}
          </div>
          <div className="row">
            <button type="button" onClick={() => setRawOpen((open) => !open)}>
              {rawOpen ? "Hide JSON" : "Raw JSON"}
            </button>
            <button className="primary" type="button" onClick={saveDraft}>
              Save
            </button>
          </div>
        </div>
        {selectedScope.type === "site" ? (
          <SiteEditor
            browser={browser}
            config={config}
            draft={draft}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
        ) : null}
        {selectedScope.type === "page" && selectedPage ? (
          <PageScopeEditor
            browser={browser}
            config={config}
            draft={draft}
            page={selectedPage}
            pageIndex={selectedScope.pageIndex}
            setDraft={setDraft}
            setSelectedScope={setSelectedScope}
            refreshPreview={refreshPreview}
            validationErrors={validationErrors}
          />
        ) : null}
        {rawOpen ? <RawEditor draft={draft} setDraft={setDraft} refreshPreview={refreshPreview} /> : null}
      </main>
      <section className="preview-panel">
        <div className="preview-header">
          <div>{previewSlug}</div>
          <button type="button" onClick={() => setPreviewVersion(Date.now())}>
            Reload
          </button>
        </div>
        <iframe
          className="preview-frame"
          data-role="preview-frame"
          data-testid="preview-frame"
          src={previewSrc}
          title="Site preview"
        />
      </section>
    </div>
  );
};

createRoot(document.querySelector("#app")).render(<App />);
