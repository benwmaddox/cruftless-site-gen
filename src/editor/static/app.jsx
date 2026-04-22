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

const postJson = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      message = JSON.parse(text).error ?? text;
    } catch {
      message = text;
    }

    throw new Error(message || `${response.status} ${response.statusText}`);
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

const FieldRenderer = ({ draft, field, path, setDraft, refreshPreview }) => {
  const value = getAtPath(draft, path);

  const update = (nextValue) => {
    setDraft((currentDraft) =>
      setAtPath(currentDraft, path, normalizeFieldValue(field, nextValue)),
    );
    refreshPreview();
  };

  if (field.kind === "readonly") {
    return null;
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
      </div>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <label className="field-inline">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => update(field.optional && !event.currentTarget.checked ? undefined : event.currentTarget.checked)}
        />
        <span>{fieldLabel(field)}</span>
      </label>
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
              key={childField.key}
              draft={draft}
              field={childField}
              path={[...path, childField.key]}
              setDraft={setDraft}
              refreshPreview={refreshPreview}
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
                key={childField.key}
                draft={draft}
                field={childField}
                path={[...path, childField.key]}
                setDraft={setDraft}
                refreshPreview={refreshPreview}
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
                    key={childField.key}
                    draft={draft}
                    field={childField}
                    path={[...path, index, childField.key]}
                    setDraft={setDraft}
                    refreshPreview={refreshPreview}
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

const SectionRenderer = ({ draft, section, basePath, setDraft, refreshPreview }) => (
  <div className="field-group">
    <h3>{section.title}</h3>
    <div className="form-grid">
      {section.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          draft={draft}
          field={field}
          path={[...basePath, field.key]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
        />
      ))}
    </div>
  </div>
);

const SiteEditor = ({ config, draft, setDraft, refreshPreview }) => {
  const sitePath = ["site"];
  const updateSiteField = (key, value) => {
    setDraft((currentDraft) => setAtPath(currentDraft, [...sitePath, key], value || undefined));
    refreshPreview();
  };

  return (
    <div className="card">
      <h2>Site</h2>
      <div className="form-grid">
        <FieldRenderer
          draft={draft}
          field={{ kind: "text", key: "name", label: "Name" }}
          path={[...sitePath, "name"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
        />
        <FieldRenderer
          draft={draft}
          field={{ kind: "text", key: "baseUrl", label: "Base URL" }}
          path={[...sitePath, "baseUrl"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
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
          draft={draft}
          field={{
            kind: "text",
            key: "pageBackgroundImageUrl",
            label: "Page background image",
            optional: true,
          }}
          path={[...sitePath, "pageBackgroundImageUrl"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
        />
        <FieldRenderer
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
        />
      </div>
    </div>
  );
};

const PageEditor = ({
  draft,
  page,
  pageIndex,
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
          draft={draft}
          field={{ kind: "text", key: "slug", label: "Slug" }}
          path={["pages", pageIndex, "slug"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
        />
        <FieldRenderer
          draft={draft}
          field={{ kind: "text", key: "title", label: "Title" }}
          path={["pages", pageIndex, "title"]}
          setDraft={setDraft}
          refreshPreview={refreshPreview}
        />
        <div className="field-group">
          <h3>Metadata</h3>
          <div className="form-grid">
            {["description", "canonicalUrl", "socialImageUrl"].map((key) => (
              <FieldRenderer
                key={key}
                draft={draft}
                field={{
                  kind: key === "description" ? "textarea" : "text",
                  key,
                  label: key,
                  optional: true,
                }}
                path={["pages", pageIndex, "metadata", key]}
                setDraft={setDraft}
                refreshPreview={refreshPreview}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ComponentEditor = ({
  config,
  draft,
  page,
  pageIndex,
  componentIndex,
  setDraft,
  refreshPreview,
}) => {
  const component = page.components[componentIndex];
  const editor = config.componentSpecs[component.type];

  const updatePageComponents = (updater) => {
    setDraft((currentDraft) => {
      const nextDraft = clone(currentDraft);
      updater(nextDraft.pages[pageIndex].components);
      return nextDraft;
    });
    refreshPreview();
  };

  return (
    <div className="card">
      <div className="list-item-header">
        <h2>{editor?.title ?? component.type}</h2>
        <div className="row">
          <button
            type="button"
            disabled={componentIndex === 0}
            onClick={() => {
              updatePageComponents((components) => {
                const moved = moveItem(components, componentIndex, componentIndex - 1);
                components.splice(0, components.length, ...moved);
              });
            }}
          >
            Up
          </button>
          <button
            type="button"
            disabled={componentIndex === page.components.length - 1}
            onClick={() => {
              updatePageComponents((components) => {
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
              updatePageComponents((components) => {
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
              if (page.components.length <= 1) {
                return;
              }
              updatePageComponents((components) => {
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
            key={section.title}
            draft={draft}
            section={section}
            basePath={["pages", pageIndex, "components", componentIndex]}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
          />
        ))
      ) : (
        <div className="empty-state">No editor exists for this component type.</div>
      )}
    </div>
  );
};

const PageScopeEditor = ({
  config,
  draft,
  page,
  pageIndex,
  setDraft,
  setSelectedScope,
  refreshPreview,
}) => {
  const componentTypeRef = useRef(null);

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

  const addComponent = () => {
    const componentType = componentTypeRef.current?.value ?? "prose";

    setDraft((currentDraft) => {
      const nextDraft = clone(currentDraft);
      nextDraft.pages[pageIndex].components.push(clone(config.componentSpecs[componentType].defaults));
      return nextDraft;
    });
    refreshPreview();
  };

  return (
    <>
      <PageEditor
        draft={draft}
        page={page}
        pageIndex={pageIndex}
        setDraft={setDraft}
        setSelectedPageIndex={(nextPageIndex) =>
          setSelectedScope({ type: "page", pageIndex: nextPageIndex })
        }
        refreshPreview={refreshPreview}
      />
      <div className="component-scope">
        <div className="list-item-header">
          <h2>Components</h2>
          <div className="row">
            <div className="grow">
              <select ref={componentTypeRef} defaultValue="prose">
                {config.componentTypes.map((componentType) => (
                  <option key={componentType} value={componentType}>
                    {config.componentSpecs[componentType].title}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={addComponent}>
              Add Component
            </button>
            <button type="button" onClick={addPage}>
              Add Page
            </button>
          </div>
        </div>
        <div className="list-stack">
          {page.components.map((component, componentIndex) => (
            <ComponentEditor
              key={`${component.type}-${componentIndex}`}
              config={config}
              draft={draft}
              page={page}
              pageIndex={pageIndex}
              componentIndex={componentIndex}
              setDraft={setDraft}
              refreshPreview={refreshPreview}
            />
          ))}
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

  useEffect(() => {
    setFolderPath(browser.directory);
  }, [browser.directory]);

  return (
    <aside className="sidebar">
      <div className="brand">Cruftless Editor</div>
      <div className="section-title">Folder</div>
      <form
        className="path-picker"
        onSubmit={(event) => {
          event.preventDefault();
          void openDirectory(folderPath);
        }}
      >
        <input
          aria-label="Folder path"
          className="folder-path"
          value={folderPath}
          onChange={(event) => setFolderPath(event.currentTarget.value)}
        />
        <button type="submit">Go</button>
      </form>
      <div className="nav-list">
        <button
          type="button"
          className="nav-item"
          disabled={!browser.parentDirectory}
          onClick={() => {
            if (browser.parentDirectory) {
              void openDirectory(browser.parentDirectory);
            }
          }}
        >
          Up one folder
        </button>
        {browser.directories.map((directory) => (
          <button
            key={directory.path}
            type="button"
            className="nav-item"
            onClick={() => void openDirectory(directory.path)}
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
            onClick={() => {
              if (!file.valid) {
                window.alert(file.error ?? "This JSON file is not valid site content.");
                return;
              }
              if (dirty && !window.confirm("Discard unsaved draft changes?")) {
                return;
              }
              void openFile(file.path);
            }}
            title={file.path}
          >
            {file.siteName ?? file.name}
            {file.valid ? "" : " (invalid)"}
          </button>
        ))}
      </div>
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
  const [status, setStatus] = useState("Loading editor...");
  const [statusKind, setStatusKind] = useState("info");
  const [previewVersion, setPreviewVersion] = useState(0);
  const updateTimer = useRef(0);
  const hasLoaded = useRef(false);

  const selectedPage =
    selectedScope.type === "page" ? draft?.pages[selectedScope.pageIndex] : undefined;
  const previewSlug = selectedScope.type === "page" ? (selectedPage?.slug ?? "/") : "/";
  const previewSrc = useMemo(
    () => `/__preview/page?slug=${encodeURIComponent(previewSlug)}&t=${previewVersion}`,
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
    setStatusMessage(`Opened ${payload.name}.`);
    setPreviewVersion(Date.now());
  };

  const openDirectory = async (directoryPath) => {
    setStatusMessage(`Browsing ${directoryPath}...`);

    try {
      const payload = await postJson("/__editor/open-directory", { path: directoryPath });
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
      setStatusMessage(`Saved ${selectedFile}.`);
      await refreshBrowser();
      setPreviewVersion(Date.now());
    } catch (error) {
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
    const events = new EventSource("/__preview/events");
    events.addEventListener("reload", () => setPreviewVersion(Date.now()));
    return () => events.close();
  }, []);

  useEffect(() => {
    if (!hasLoaded.current || !dirty || !draft) {
      return;
    }

    window.clearTimeout(updateTimer.current);
    setStatusMessage("Updating preview...");
    updateTimer.current = window.setTimeout(async () => {
      try {
        await postJson("/__preview/draft", draft);
        setStatusMessage("Draft preview updated.");
        setPreviewVersion(Date.now());
      } catch (error) {
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
            config={config}
            draft={draft}
            setDraft={setDraft}
            refreshPreview={refreshPreview}
          />
        ) : null}
        {selectedScope.type === "page" && selectedPage ? (
          <PageScopeEditor
            config={config}
            draft={draft}
            page={selectedPage}
            pageIndex={selectedScope.pageIndex}
            setDraft={setDraft}
            setSelectedScope={setSelectedScope}
            refreshPreview={refreshPreview}
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
