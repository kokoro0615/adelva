/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(43, 23%, 97%)',
            '100': 'hsl(43, 23%, 94%)',
            '200': 'hsl(43, 23%, 86%)',
            '300': 'hsl(43, 23%, 76%)',
            '400': 'hsl(43, 23%, 64%)',
            '500': 'hsl(43, 23%, 50%)',
            '600': 'hsl(43, 23%, 40%)',
            '700': 'hsl(43, 23%, 32%)',
            '800': 'hsl(43, 23%, 24%)',
            '900': 'hsl(43, 23%, 16%)',
            '950': 'hsl(43, 23%, 10%)',
            DEFAULT: '#f3f1ec'
        },
        secondary: {
            '50': 'hsl(222, 37%, 97%)',
            '100': 'hsl(222, 37%, 94%)',
            '200': 'hsl(222, 37%, 86%)',
            '300': 'hsl(222, 37%, 76%)',
            '400': 'hsl(222, 37%, 64%)',
            '500': 'hsl(222, 37%, 50%)',
            '600': 'hsl(222, 37%, 40%)',
            '700': 'hsl(222, 37%, 32%)',
            '800': 'hsl(222, 37%, 24%)',
            '900': 'hsl(222, 37%, 16%)',
            '950': 'hsl(222, 37%, 10%)',
            DEFAULT: '#1f2a44'
        },
        accent: {
            '50': 'hsl(27, 100%, 97%)',
            '100': 'hsl(27, 100%, 94%)',
            '200': 'hsl(27, 100%, 86%)',
            '300': 'hsl(27, 100%, 76%)',
            '400': 'hsl(27, 100%, 64%)',
            '500': 'hsl(27, 100%, 50%)',
            '600': 'hsl(27, 100%, 40%)',
            '700': 'hsl(27, 100%, 32%)',
            '800': 'hsl(27, 100%, 24%)',
            '900': 'hsl(27, 100%, 16%)',
            '950': 'hsl(27, 100%, 10%)',
            DEFAULT: '#ff7e15'
        },
        'neutral-50': '#ffffff',
        'neutral-100': '#000000',
        'neutral-200': '#535353',
        'neutral-300': '#090b10',
        'neutral-400': '#e9e7e1',
        'neutral-500': '#c0c0c0',
        background: '#ffffff',
        foreground: '#000000'
    },
    fontFamily: {
        sans: [
            'Inter Tight',
            'sans-serif'
        ],
        heading: [
            'Arial',
            'sans-serif'
        ],
        font2: [
            'Times New Roman',
            'sans-serif'
        ],
        font3: [
            'Cardinal Classic Long',
            'sans-serif'
        ],
        font4: [
            'Oswald',
            'sans-serif'
        ]
    },
    fontSize: {
        '14': [
            '14px',
            {
                lineHeight: '16.8px'
            }
        ],
        '16': [
            '16px',
            {
                lineHeight: 'normal'
            }
        ],
        '32': [
            '32px',
            {
                lineHeight: '0px'
            }
        ],
        '284.444': [
            '284.444px',
            {
                lineHeight: '256px'
            }
        ],
        '227.555': [
            '227.555px',
            {
                lineHeight: '227.555px'
            }
        ],
        '124.444': [
            '124.444px',
            {
                lineHeight: 'normal'
            }
        ],
        '53.3333': [
            '53.3333px',
            {
                lineHeight: '53.3333px'
            }
        ],
        '46.2222': [
            '46.2222px',
            {
                lineHeight: '0px'
            }
        ],
        '37.3333': [
            '37.3333px',
            {
                lineHeight: '37.3333px'
            }
        ],
        '28.4444': [
            '28.4444px',
            {
                lineHeight: '34.1333px'
            }
        ],
        '19.5555': [
            '19.5555px',
            {
                lineHeight: '23.4666px'
            }
        ],
        '17.7778': [
            '17.7778px',
            {
                lineHeight: '21.3333px'
            }
        ],
        '14.2222': [
            '14.2222px',
            {
                lineHeight: 'normal'
            }
        ],
        '12.4444': [
            '12.4444px',
            {
                lineHeight: '18.6666px'
            }
        ],
        '10.6667': [
            '10.6667px',
            {
                lineHeight: '12.8px'
            }
        ]
    },
    spacing: {
        '0': '4px',
        '1': '21px',
        '2': '24px',
        '3': '36px',
        '4': '39px',
        '5': '53px',
        '6': '58px',
        '7': '71px',
        '8': '89px',
        '9': '111px',
        '10': '124px',
        '11': '142px',
        '12': '178px',
        '13': '227px',
        '14': '284px'
    },
    borderRadius: {
        xs: '2px',
        sm: '5px',
        full: '100px'
    },
    boxShadow: {
        xs: 'rgba(255, 255, 255, 0.2) 0.35px 0.35px 0px 0px inset, rgba(255, 255, 255, 0.2) 0px 0px 1.75px 0px inset'
    },
    screens: {
        md: '769px',
        '2xl': '1560px'
    },
    transitionDuration: {
        '0': '0s',
        '300': '0.3s',
        '400': '0.4s',
        '450': '0.45s',
        '600': '0.6s',
        '1000': '1s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0.16, 1, 0.3, 1)',
        default: 'ease'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '1280px'
    }
},
  },
};
