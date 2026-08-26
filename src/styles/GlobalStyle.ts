import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.base};
  }
  * { box-sizing: border-box; }

  /* Targeted brand overrides on top of antd v4's default blue.
     antd/dist/antd.css is imported first (in main.tsx); styled-components injects at the
     end of <head>, so these win specificity ties without !important. */
  .ant-btn-primary {
    background: ${({ theme }) => theme.colors.brand};
    border-color: ${({ theme }) => theme.colors.brand};
  }
  .ant-btn-primary:hover,
  .ant-btn-primary:focus {
    background: ${({ theme }) => theme.colors.brandDark};
    border-color: ${({ theme }) => theme.colors.brandDark};
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }
`;
