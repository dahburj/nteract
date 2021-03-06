import {
  actions,
  AppState,
  createContentRef,
  createHostRef,
  createKernelRef,
  createKernelspecsRef,
  makeAppRecord,
  makeCommsRecord,
  makeContentsRecord,
  makeDummyContentRecord,
  makeEntitiesRecord,
  makeHostsRecord,
  makeJupyterHostRecord,
  makeStateRecord,
  makeTransformsRecord
} from "@nteract/core";
import { CodeMirrorCSS, ShowHintCSS } from "@nteract/editor";
import { Media } from "@nteract/outputs";
import { GlobalCSSVariables } from "@nteract/presentational-components";
import { ContentRecord, HostRecord } from "@nteract/types";

import { GlobalMenuStyle } from "@nteract/connected-components";

import * as Immutable from "immutable";
import * as React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createGlobalStyle } from "styled-components";

import { JupyterConfigData } from "./config";

import App from "./app";

import("./fonts");

import configureStore from "./store";

const GlobalAppStyle = createGlobalStyle`
    html {
      -webkit-box-sizing: border-box;
      box-sizing: border-box;
    }
  
    *,
    *::before,
    *::after {
      -webkit-box-sizing: inherit;
      box-sizing: inherit;
    }
  
    body {
      font-family: "Source Sans Pro";
      font-size: 16px;
      background-color: var(--theme-app-bg);
      color: var(--theme-app-fg);
      margin: 0;
    }
  
    #app {
      padding-top: 20px;
    }
  
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  
    div#loading {
      animation-name: fadeOut;
      animation-duration: 0.25s;
      animation-fill-mode: forwards;
    }
  `;

export async function main(config: JupyterConfigData, rootEl): Promise<void> {
  // When the data element isn't there, provide an error message
  // Primarily for development usage

  const jupyterHostRecord = makeJupyterHostRecord({
    id: null,
    type: "jupyter",
    defaultKernelName: "python",
    token: config.token,
    origin: location.origin,
    basePath: config.baseUrl
  });

  const hostRef = createHostRef();
  const contentRef = createContentRef();
  const NullTransform = () => null;
  const kernelspecsRef = createKernelspecsRef();

  const initialState: AppState = {
    app: makeAppRecord({
      version: `nteract-on-jupyter@${config.appVersion}`,
      host: jupyterHostRecord
    }),
    comms: makeCommsRecord(),
    config: Immutable.Map({
      theme: "light"
    }),
    core: makeStateRecord({
      currentKernelspecsRef: kernelspecsRef,
      entities: makeEntitiesRecord({
        hosts: makeHostsRecord({
          byRef: Immutable.Map<string, HostRecord>().set(
            hostRef,
            jupyterHostRecord
          )
        }),
        contents: makeContentsRecord({
          byRef: Immutable.Map<string, ContentRecord>().set(
            contentRef,
            makeDummyContentRecord({
              filepath: config.contentsPath
            })
          )
        }),
        transforms: makeTransformsRecord({
          displayOrder: Immutable.List([
            "application/vnd.jupyter.widget-view+json",
            "application/vnd.vega.v3+json",
            "application/vnd.vega.v2+json",
            "application/vnd.vegalite.v2+json",
            "application/vnd.vegalite.v1+json",
            "application/geo+json",
            "application/vnd.plotly.v1+json",
            "text/vnd.plotly.v1+html",
            "application/x-nteract-model-debug+json",
            "application/vnd.dataresource+json",
            "application/vdom.v1+json",
            "application/json",
            "application/javascript",
            "text/html",
            "text/markdown",
            "text/latex",
            "image/svg+xml",
            "image/gif",
            "image/png",
            "image/jpeg",
            "text/plain"
          ]),
          byId: Immutable.Map({
            "text/vnd.plotly.v1+html": NullTransform,
            "application/vnd.plotly.v1+json": NullTransform,
            "application/geo+json": NullTransform,
            "application/x-nteract-model-debug+json": NullTransform,
            "application/vnd.dataresource+json": NullTransform,
            "application/vnd.jupyter.widget-view+json": NullTransform,
            "application/vnd.vegalite.v1+json": NullTransform,
            "application/vnd.vegalite.v2+json": NullTransform,
            "application/vnd.vega.v2+json": NullTransform,
            "application/vnd.vega.v3+json": NullTransform,
            "application/vdom.v1+json": NullTransform,
            "application/json": Media.Json,
            "application/javascript": Media.JavaScript,
            "text/html": Media.HTML,
            "text/markdown": Media.Markdown,
            "text/latex": Media.LaTeX,
            "image/svg": Media.SVG,
            "image/gif": Media.Image,
            "image/png": Media.Image,
            "image/jpeg": Media.Image,
            "text/plain": Media.Plain
          })
        })
      })
    })
  };

  const kernelRef = createKernelRef();

  const store = configureStore(initialState);
  (window as any).store = store;

  store.dispatch(
    actions.fetchContent({
      filepath: config.contentsPath,
      params: {},
      kernelRef,
      contentRef
    })
  );
  store.dispatch(actions.fetchKernelspecs({ hostRef, kernelspecsRef }));

  ReactDOM.render(
    <React.Fragment>
      {/* Keep global styles out of the provider backed render cycle */}
      <GlobalAppStyle />
      <GlobalCSSVariables />

      <CodeMirrorCSS />
      <ShowHintCSS />

      <GlobalMenuStyle />

      <Provider store={store}>
        <App contentRef={contentRef} />
      </Provider>
    </React.Fragment>,
    rootEl
  );
}
