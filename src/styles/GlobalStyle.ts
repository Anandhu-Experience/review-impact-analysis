import { createGlobalStyle } from 'styled-components';

/**
 * XMP "new shell" styling, applied to the mandated antd v4 widget set.
 *
 * antd/dist/antd.css is imported first (in main.tsx); styled-components injects at the
 * end of <head>, so these win specificity ties without !important. The tokens below are
 * the same values as src/styles/theme.ts — duplicated as CSS variables because antd's
 * rules are plain CSS and never see the styled-components ThemeProvider.
 */
export const GlobalStyle = createGlobalStyle`
  :root {
    --ria-bg: #ffffff;
    --ria-surface: #ffffff;
    --ria-muted: #f7f8fa;
    --ria-text: #16181d;
    --ria-text-muted: #6b7280;
    --ria-border: #e3e6ea;
    --ria-input: #d7dbe0;
    --ria-ink: #16181d;
    --ria-ink-hover: #2c2f38;
    --ria-accent: #1b4db1;
    --ria-accent-soft: #eef3ff;
    --ria-accent-border: #cfdcfb;
    --ria-danger: #b42318;
    --ria-radius: 6px;
    --ria-radius-lg: 10px;
    --ria-shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05);
    --ria-shadow-pop: 0 8px 24px rgba(16, 24, 40, 0.10);
    --ria-font: 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --ria-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
  }

  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background: var(--ria-bg);
    color: var(--ria-text);
    font-family: var(--ria-font);
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }

  /* antd hard-codes its own font stack on the root class and on form controls. */
  body,
  .ant-layout,
  .ant-card,
  .ant-btn,
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-select,
  .ant-table,
  .ant-menu,
  .ant-typography,
  .ant-form,
  .ant-modal,
  .ant-tag,
  .ant-segmented,
  .ant-list,
  .ant-steps,
  .ant-empty,
  .ant-result,
  .ant-tooltip,
  .ant-alert {
    font-family: var(--ria-font);
    font-feature-settings: normal;
  }

  /* One focus treatment everywhere, instead of the raw user-agent ring antd leaves on
     unstyled tabs/links. */
  :where(a, button, [role='button'], input, select, textarea, .ant-btn):focus-visible {
    outline: 2px solid var(--ria-accent);
    outline-offset: 2px;
  }

  /* ---------- Layout ---------- */
  .ant-layout { background: var(--ria-bg); }
  .ant-layout-sider { background: var(--ria-muted); }
  /* Sider wraps its children in .ant-layout-sider-children, so the column that pins the
     context footer to the bottom has to live on the wrapper, not on the Sider. */
  .ant-layout-sider-children { display: flex; flex-direction: column; height: 100%; }
  .ant-layout-header {
    height: 56px;
    line-height: normal;
    background: var(--ria-surface);
    border-bottom: 1px solid var(--ria-border);
  }
  .ant-layout-content { background: var(--ria-bg); }

  /* ---------- Typography ---------- */
  h1.ant-typography, h2.ant-typography, h3.ant-typography,
  h4.ant-typography, h5.ant-typography,
  .ant-typography h1, .ant-typography h2, .ant-typography h3,
  .ant-typography h4, .ant-typography h5 {
    color: var(--ria-text);
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  .ant-typography { color: var(--ria-text); }
  .ant-typography.ant-typography-secondary { color: var(--ria-text-muted); }
  .ant-typography a, a { color: var(--ria-accent); }
  a:hover { color: var(--ria-accent); text-decoration: underline; }
  code, kbd, samp, pre, .ant-typography code { font-family: var(--ria-mono); }
  .ant-typography code {
    background: var(--ria-muted);
    border: 1px solid var(--ria-border);
    border-radius: 4px;
    font-size: 11.5px;
  }

  /* ---------- Buttons ---------- */
  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 32px;
    padding: 0 12px;
    border-radius: var(--ria-radius);
    border-color: var(--ria-input);
    color: var(--ria-text);
    background: var(--ria-surface);
    font-size: 13px;
    font-weight: 500;
    box-shadow: none;
    text-shadow: none;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  }
  .ant-btn > .anticon + span,
  .ant-btn > span + .anticon { margin-left: 0; }
  .ant-btn:hover, .ant-btn:focus {
    color: var(--ria-text);
    border-color: var(--ria-input);
    background: var(--ria-muted);
  }
  .ant-btn-lg { height: 36px; padding: 0 16px; font-size: 14px; border-radius: var(--ria-radius); }
  .ant-btn-sm { height: 28px; padding: 0 10px; font-size: 12.5px; border-radius: var(--ria-radius); }

  .ant-btn-primary,
  .ant-btn-primary:focus {
    background: var(--ria-ink);
    border-color: var(--ria-ink);
    color: #fff;
  }
  .ant-btn-primary:hover {
    background: var(--ria-ink-hover);
    border-color: var(--ria-ink-hover);
    color: #fff;
  }

  .ant-btn-dangerous,
  .ant-btn-dangerous:focus {
    color: var(--ria-danger);
    border-color: #fda29b;
    background: var(--ria-surface);
  }
  .ant-btn-dangerous:hover { color: var(--ria-danger); border-color: #fda29b; background: #fef3f2; }
  .ant-btn-dangerous.ant-btn-primary,
  .ant-btn-dangerous.ant-btn-primary:focus { background: var(--ria-danger); border-color: var(--ria-danger); color: #fff; }
  .ant-btn-dangerous.ant-btn-primary:hover { background: #912018; border-color: #912018; }
  .ant-btn-background-ghost.ant-btn-dangerous { background: var(--ria-surface); }

  .ant-btn-link { color: var(--ria-accent); border-color: transparent; background: transparent; }
  .ant-btn-link:hover, .ant-btn-link:focus { color: var(--ria-accent); background: var(--ria-accent-soft); border-color: transparent; }
  .ant-btn-text { border-color: transparent; background: transparent; }
  .ant-btn-text:hover, .ant-btn-text:focus { background: var(--ria-muted); border-color: transparent; }

  .ant-btn[disabled],
  .ant-btn[disabled]:hover {
    background: var(--ria-surface);
    border-color: var(--ria-border);
    color: var(--ria-text-muted);
    opacity: 0.55;
  }
  .ant-btn-primary[disabled],
  .ant-btn-primary[disabled]:hover { background: var(--ria-ink); border-color: var(--ria-ink); color: #fff; }

  /* ---------- Cards ---------- */
  .ant-card {
    background: var(--ria-surface);
    border: 1px solid var(--ria-border);
    border-radius: var(--ria-radius-lg);
    box-shadow: none;
  }
  .ant-card-bordered { border-color: var(--ria-border); }
  .ant-card-head {
    min-height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid var(--ria-border);
    color: var(--ria-text);
    font-weight: 600;
  }
  .ant-card-head-title { padding: 13px 0; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
  .ant-card-extra { padding: 13px 0; font-size: 12.5px; }
  .ant-card-body { padding: 16px; }
  .ant-card-small > .ant-card-head { min-height: 40px; padding: 0 12px; }
  .ant-card-small > .ant-card-head > .ant-card-head-wrapper > .ant-card-head-title { padding: 9px 0; font-size: 13px; }
  .ant-card-grid, .ant-card-type-inner .ant-card-head { box-shadow: none; }
  .ant-card-meta-title { font-weight: 600; }
  .ant-card-meta-description { color: var(--ria-text-muted); font-size: 13px; }

  /* ---------- Tables ---------- */
  .ant-table { background: var(--ria-surface); color: var(--ria-text); font-size: 13px; }
  .ant-table-thead > tr > th {
    background: var(--ria-muted);
    border-bottom: 1px solid var(--ria-border);
    color: var(--ria-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 10px 12px;
  }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--ria-border); padding: 12px; }
  .ant-table-tbody > tr.ant-table-row:hover > td,
  .ant-table-tbody > tr > td.ant-table-cell-row-hover { background: var(--ria-muted); }
  .ant-table-tbody > tr.ant-table-row-selected > td { background: var(--ria-accent-soft); }
  .ant-table-container, .ant-table-content { border-radius: 0; }
  .ant-table-column-sorter-up.active, .ant-table-column-sorter-down.active { color: var(--ria-text); }
  .ant-table-filter-trigger.active { color: var(--ria-accent); }

  .ant-pagination-item,
  .ant-pagination-prev .ant-pagination-item-link,
  .ant-pagination-next .ant-pagination-item-link {
    border-radius: var(--ria-radius);
    border-color: var(--ria-input);
  }
  .ant-pagination-item a { color: var(--ria-text); }
  .ant-pagination-item-active { border-color: var(--ria-text); font-weight: 600; }
  .ant-pagination-item-active a { color: var(--ria-text); }

  /* ---------- Form controls ---------- */
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-picker,
  .ant-select:not(.ant-select-customize-input) .ant-select-selector {
    border-radius: var(--ria-radius);
    border-color: var(--ria-input);
    color: var(--ria-text);
    font-size: 13px;
    box-shadow: none;
  }
  .ant-input:hover,
  .ant-input-affix-wrapper:hover,
  .ant-input-number:hover,
  .ant-picker:hover,
  .ant-select:not(.ant-select-disabled):hover .ant-select-selector { border-color: var(--ria-accent); }
  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper-focused,
  .ant-picker-focused,
  .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
    border-color: var(--ria-accent);
    box-shadow: 0 0 0 2px rgba(27, 77, 177, 0.16);
  }
  .ant-input::placeholder, .ant-select-selection-placeholder { color: #9aa1ab; }

  .ant-select-dropdown {
    border: 1px solid var(--ria-border);
    border-radius: var(--ria-radius-lg);
    box-shadow: var(--ria-shadow-pop);
    padding: 4px;
  }
  .ant-select-item { border-radius: var(--ria-radius); font-size: 13px; min-height: 32px; line-height: 22px; }
  .ant-select-item-option-active:not(.ant-select-item-option-disabled) { background: var(--ria-muted); }
  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background: var(--ria-accent-soft);
    color: var(--ria-accent);
    font-weight: 600;
  }

  .ant-form-item-label > label {
    color: var(--ria-text-muted);
    font-size: 12px;
    font-weight: 500;
    height: auto;
    margin-bottom: 4px;
  }
  .ant-form-item-explain-error { font-size: 11.5px; color: var(--ria-danger); }
  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-input-affix-wrapper { border-color: var(--ria-danger); }

  .ant-checkbox-checked .ant-checkbox-inner,
  .ant-radio-checked .ant-radio-inner { background: var(--ria-accent); border-color: var(--ria-accent); }
  .ant-radio-inner::after { background: #fff; }
  .ant-switch-checked { background: var(--ria-accent); }

  /* ---------- Tags / pills ---------- */
  .ant-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 6px;
    padding: 1px 8px;
    border: 1px solid transparent;
    border-radius: var(--ria-radius);
    background: #f2f4f7;
    color: #475467;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
  }
  .ant-tag-blue, .ant-tag-processing, .ant-tag-geekblue { background: #eff8ff; color: #175cd3; }
  .ant-tag-green, .ant-tag-success, .ant-tag-lime { background: #ecfdf3; color: #067647; }
  .ant-tag-red, .ant-tag-error, .ant-tag-volcano, .ant-tag-magenta { background: #fef3f2; color: #b42318; }
  .ant-tag-orange, .ant-tag-gold, .ant-tag-warning, .ant-tag-yellow { background: #fffaeb; color: #b54708; }
  .ant-tag-purple { background: #f4f3ff; color: #6941c6; }
  .ant-tag-cyan { background: #ecfeff; color: #0e7090; }
  .ant-tag-default { background: #f2f4f7; color: #475467; }
  .ant-tag-has-color { border-color: transparent; }

  /* ---------- Segmented / Steps / Progress ---------- */
  .ant-segmented {
    background: var(--ria-muted);
    border: 1px solid var(--ria-border);
    border-radius: var(--ria-radius-lg);
    padding: 3px;
  }
  .ant-segmented-item { color: var(--ria-text-muted); font-size: 13px; font-weight: 500; }
  .ant-segmented-item:hover:not(.ant-segmented-item-selected) { color: var(--ria-text); }
  .ant-segmented-item-selected {
    background: var(--ria-surface);
    border-radius: var(--ria-radius);
    box-shadow: var(--ria-shadow-sm);
    color: var(--ria-text);
    font-weight: 600;
  }

  .ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-icon {
    background: var(--ria-ink);
    border-color: var(--ria-ink);
  }
  .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-icon {
    background: var(--ria-accent-soft);
    border-color: var(--ria-accent-border);
  }
  .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-icon > .ant-steps-icon { color: var(--ria-accent); }
  .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-tail::after { background: var(--ria-accent-border); }
  /* Upcoming stages still carried antd's rgba(0,0,0,.25) greys. */
  .ant-steps-item-wait > .ant-steps-item-container > .ant-steps-item-icon {
    background: var(--ria-surface);
    border-color: var(--ria-input);
  }
  .ant-steps-item-wait > .ant-steps-item-container > .ant-steps-item-icon > .ant-steps-icon,
  .ant-steps-item-wait > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title {
    color: var(--ria-text-muted);
  }
  .ant-steps-item-process > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title,
  .ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-content > .ant-steps-item-title {
    color: var(--ria-text);
  }
  .ant-steps-item-wait > .ant-steps-item-container > .ant-steps-item-tail::after { background: var(--ria-border); }
  .ant-steps-item-title { font-size: 13px; font-weight: 600; }
  .ant-steps-item-description { font-size: 12.5px; color: var(--ria-text-muted) !important; }

  .ant-progress-inner { background: #f2f4f7; }
  .ant-progress-bg, .ant-progress-success-bg { background: var(--ria-accent); }
  .ant-progress-circle-path { stroke: var(--ria-accent); }
  .ant-progress-circle-trail { stroke: #f2f4f7; }
  .ant-progress-text { color: var(--ria-text-muted); font-family: var(--ria-mono); font-size: 12px; }
  .ant-spin-dot-item { background-color: var(--ria-accent); }

  /* ---------- Statistic ---------- */
  .ant-statistic-title {
    margin-bottom: 4px;
    color: var(--ria-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ant-statistic-content { color: var(--ria-text); font-family: var(--ria-mono); font-size: 22px; font-weight: 600; }
  /* Units read as labels next to the figure, not as part of it: sans, muted, tight. */
  .ant-statistic-content-suffix, .ant-statistic-content-prefix {
    font-family: var(--ria-font);
    font-size: 13px;
    font-weight: 500;
    color: var(--ria-text-muted);
  }
  .ant-statistic-content-prefix { margin-right: 2px; }
  .ant-statistic-content-suffix { margin-left: 3px; }

  /* ---------- Menu (sidebar nav) ---------- */
  .ant-menu { background: transparent; color: var(--ria-text-muted); }
  .ant-menu-inline, .ant-menu-vertical { border-right: none; }
  .ant-menu-inline .ant-menu-item {
    width: auto;
    height: 36px;
    margin: 2px 0;
    padding-left: 12px !important;
    border-radius: var(--ria-radius);
    color: var(--ria-text-muted);
    font-size: 13px;
    font-weight: 500;
    line-height: 36px;
  }
  .ant-menu-inline .ant-menu-item .anticon { font-size: 15px; min-width: 16px; }
  .ant-menu-light .ant-menu-item:hover,
  .ant-menu-light .ant-menu-item-active { color: var(--ria-text); background: var(--ria-surface); }
  .ant-menu-light .ant-menu-item-selected,
  .ant-menu-light .ant-menu-item-selected:hover,
  .ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected,
  .ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected:hover {
    background: var(--ria-surface);
    color: var(--ria-text);
    font-weight: 600;
    box-shadow: var(--ria-shadow-sm);
  }
  .ant-menu-light .ant-menu-item-selected::after,
  .ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected::after { display: none; }
  .ant-menu-light .ant-menu-item-selected .anticon,
  .ant-menu:not(.ant-menu-horizontal) .ant-menu-item-selected .anticon { color: var(--ria-text); }
  .ant-menu-item-disabled { color: #a9afb8 !important; }

  /* ---------- Overlays ---------- */
  .ant-modal-content { border-radius: 12px; box-shadow: 0 16px 40px rgba(16, 24, 40, 0.18); overflow: hidden; }
  .ant-modal-header { border-bottom: 1px solid var(--ria-border); padding: 14px 20px; }
  .ant-modal-title { font-size: 15px; font-weight: 600; }
  .ant-modal-body { padding: 20px; font-size: 13.5px; }
  .ant-modal-footer { border-top: 1px solid var(--ria-border); padding: 12px 20px; }
  .ant-modal-confirm-body .ant-modal-confirm-title { font-size: 15px; font-weight: 600; }
  .ant-modal-confirm-body .ant-modal-confirm-content { color: var(--ria-text-muted); font-size: 13px; }

  .ant-tooltip-inner { background: var(--ria-ink); border-radius: var(--ria-radius); font-size: 12px; padding: 6px 10px; box-shadow: var(--ria-shadow-pop); }
  .ant-tooltip-arrow-content { background: var(--ria-ink); }

  .ant-message-notice-content {
    border: 1px solid var(--ria-border);
    border-radius: var(--ria-radius-lg);
    box-shadow: var(--ria-shadow-pop);
    font-size: 13px;
  }

  .ant-alert { border-radius: var(--ria-radius-lg); border: 1px solid var(--ria-border); font-size: 13px; padding: 10px 14px; }
  .ant-alert-message { font-weight: 600; }
  .ant-alert-info { background: var(--ria-accent-soft); border-color: var(--ria-accent-border); }
  .ant-alert-info .ant-alert-message, .ant-alert-info .ant-alert-icon { color: var(--ria-accent); }
  .ant-alert-success { background: #ecfdf3; border-color: #abefc6; }
  .ant-alert-success .ant-alert-message, .ant-alert-success .ant-alert-icon { color: #067647; }
  .ant-alert-warning { background: #fffaeb; border-color: #fedf89; }
  .ant-alert-warning .ant-alert-message, .ant-alert-warning .ant-alert-icon { color: #b54708; }
  .ant-alert-error { background: #fef3f2; border-color: #fda29b; }
  .ant-alert-error .ant-alert-message, .ant-alert-error .ant-alert-icon { color: #b42318; }

  /* ---------- Misc widgets ---------- */
  .ant-badge-count { background: #f04438; box-shadow: none; font-family: var(--ria-mono); font-size: 11px; font-weight: 500; }
  .ant-rate { color: #f79009; font-size: 15px; }
  .ant-list-item { border-bottom: 1px solid var(--ria-border); padding: 12px 0; }
  .ant-list-item-meta-title { font-size: 13.5px; font-weight: 600; }
  .ant-list-item-meta-description { color: var(--ria-text-muted); font-size: 12.5px; }
  .ant-empty-description { color: var(--ria-text-muted); font-size: 13px; }
  .ant-result-icon > .anticon { font-size: 44px; }
  .ant-result-success .ant-result-icon > .anticon { color: #17b26a; }
  .ant-result-info .ant-result-icon > .anticon { color: var(--ria-accent); }
  .ant-result-warning .ant-result-icon > .anticon { color: #f79009; }
  .ant-result-error .ant-result-icon > .anticon { color: #f04438; }
  .ant-result-title { font-size: 18px; font-weight: 600; }
  .ant-result-subtitle { color: var(--ria-text-muted); font-size: 13px; }
  .ant-divider { border-color: var(--ria-border); }

  /* ---------- Drill-down affordances ---------- */
  /* A card that stands for a set of reviews: the whole surface is the link. */
  .ria-clickable {
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
  }
  .ria-clickable:hover { border-color: var(--ria-accent-border); box-shadow: var(--ria-shadow-sm); }
  .ria-clickable:hover .ant-statistic-content { color: var(--ria-accent); }

  /* An inline count inside a sentence. */
  .ria-count-link {
    padding: 0;
    border: none;
    border-bottom: 1px dashed var(--ria-accent-border);
    background: none;
    color: var(--ria-accent);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
  }
  .ria-count-link:hover { border-bottom-style: solid; }

  /* Recharts: match axis/tooltip chrome to the shell. */
  .recharts-cartesian-axis-tick-value { font-size: 11px; fill: var(--ria-text-muted); }
  .recharts-default-tooltip {
    border: 1px solid var(--ria-border) !important;
    border-radius: var(--ria-radius) !important;
    box-shadow: var(--ria-shadow-pop);
    font-size: 12px;
  }
  .recharts-legend-item-text { color: var(--ria-text-muted) !important; font-size: 12px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }
`;
