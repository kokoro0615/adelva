// React Theme — extracted from https://white-desert.com/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
    neutral500: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '16': string;
    '32': string;
    '284.444': string;
    '227.555': string;
    '124.444': string;
    '53.3333': string;
    '46.2222': string;
    '37.3333': string;
    '28.4444': string;
    '19.5555': string;
    '17.7778': string;
    '14.2222': string;
 *   };
 *   space: {
    '4': string;
    '21': string;
    '24': string;
    '36': string;
    '39': string;
    '53': string;
    '58': string;
    '71': string;
    '89': string;
    '111': string;
    '124': string;
    '142': string;
    '178': string;
    '227': string;
    '284': string;
 *   };
 *   radii: {
    xs: string;
    sm: string;
    full: string;
 *   };
 *   shadows: {
    xs: string;
 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#f3f1ec",
    "secondary": "#1f2a44",
    "accent": "#ff7e15",
    "background": "#ffffff",
    "foreground": "#000000",
    "neutral50": "#ffffff",
    "neutral100": "#000000",
    "neutral200": "#535353",
    "neutral300": "#090b10",
    "neutral400": "#e9e7e1",
    "neutral500": "#c0c0c0"
  },
  "fonts": {
    "body": "'Oswald', sans-serif"
  },
  "fontSizes": {
    "16": "16px",
    "32": "32px",
    "284.444": "284.444px",
    "227.555": "227.555px",
    "124.444": "124.444px",
    "53.3333": "53.3333px",
    "46.2222": "46.2222px",
    "37.3333": "37.3333px",
    "28.4444": "28.4444px",
    "19.5555": "19.5555px",
    "17.7778": "17.7778px",
    "14.2222": "14.2222px"
  },
  "space": {
    "4": "4px",
    "21": "21px",
    "24": "24px",
    "36": "36px",
    "39": "39px",
    "53": "53px",
    "58": "58px",
    "71": "71px",
    "89": "89px",
    "111": "111px",
    "124": "124px",
    "142": "142px",
    "178": "178px",
    "227": "227px",
    "284": "284px"
  },
  "radii": {
    "xs": "2px",
    "sm": "5px",
    "full": "100px"
  },
  "shadows": {
    "xs": "rgba(255, 255, 255, 0.2) 0.35px 0.35px 0px 0px inset, rgba(255, 255, 255, 0.2) 0px 0px 1.75px 0px inset"
  },
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#f3f1ec",
      "light": "hsl(43, 23%, 95%)",
      "dark": "hsl(43, 23%, 79%)"
    },
    "secondary": {
      "main": "#1f2a44",
      "light": "hsl(222, 37%, 34%)",
      "dark": "hsl(222, 37%, 10%)"
    },
    "background": {
      "default": "#ffffff",
      "paper": "#000000"
    },
    "text": {
      "primary": "#000000",
      "secondary": "#1f2a44"
    }
  },
  "typography": {
    "h1": {
      "fontSize": "37.3333px",
      "fontWeight": "400",
      "lineHeight": "37.3333px"
    }
  },
  "shape": {
    "borderRadius": 2
  },
  "shadows": [
    "rgba(255, 255, 255, 0.2) 0.35px 0.35px 0px 0px inset, rgba(255, 255, 255, 0.2) 0px 0px 1.75px 0px inset"
  ]
};

export default theme;
