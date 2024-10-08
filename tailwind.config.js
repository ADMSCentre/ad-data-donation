/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}'
  ],

  darkMode: 'media',
  theme: {
    // boxShadow: {
    //   top4px: 'inset 0 4px 0 0 rgba(0, 0, 0, 0.15)',
    //   top2px: 'inset 0 2px 0 0 rgba(0, 0, 0, 0.15)',
    //   '2xl': '0 5px 20px 0px rgba(0, 0, 0, 0.10)'
    // },
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primarylight: 'rgb(var(--color-primary-light) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        secondarylight: 'rgb(var(--color-secondary-light) / <alpha-value>)',
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        tertiarylight: 'rgb(var(--color-tertiary-light) / <alpha-value>)',
        behind: 'rgb(var(--color-behind) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        successlight: 'rgb(var(--color-success-light) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        warninglight: 'rgb(var(--color-warning-light) / <alpha-value>)',
        delete: 'rgb(var(--color-delete) / <alpha-value>)',
        deletelight: 'rgb(var(--color-delete-light) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        errorlight: 'rgb(var(--color-error-light) / <alpha-value>)',
      },
      opacity: {
        shadow: '.15'
      },
      spacing: {
        '1px': '1px',
        '2px': '2px',
        '3px': '3px',
        '5px': '5px',
        '6px': '6px',
        '7px': '7px',
        '9px': '9px',
        '10px': '10px',
        '11px': '11px',
        '13px': '13px',
        '14px': '14px',
        '15px': '15px',
        '17px': '17px',
        '18px': '18px',
        '19px': '19px',
        '30px': '30px',
        '48px': '48px',
        '44px': '44px',
        '84px': '84px',
        '200px': '200px',
        '224px': '224px',
        30: '120px',
        34: '136px',
        35: '140px'
      },
      width: {
        sidebar: '320px',
        logo: '240px',
        'logo-sm': '48px',
        sheet: '760px',
        form: '400px',
        card: '376px',
        'image-preview': '120px',
        'image-preview-sm': '200px',
        'image-preview-circle': '120px',
        'image-preview-circle-sm': '150px',
        'button-sm': '14px',
        popup: '480px',
        'popup-sm': '520px',
        'popup-md': '730px',
        'popup-lg': '1228px'
      },
      height: {
        footer: '88px',
        logo: '110px',
        table: 384,
        'logo-sm': '48px',
        'image-card': '200px',
        'image-preview': '90px',
        'image-preview-sm': '150px',
        'image-preview-circle': '120px',
        'image-preview-circle-sm': '150px',
        'button-sm': '14px'
      },
      fontFamily: {
        title0: ['Montserrat-Bold', 'sans-serif'],
        title1: ['Montserrat-Bold', 'sans-serif'],
        title2: ['Montserrat-Bold', 'sans-serif'],
        title3: ['Montserrat-Bold', 'sans-serif'],
        title4: ['Montserrat-Bold', 'sans-serif'],
        title5: ['Montserrat-SemiBold', 'sans-serif'],
        title6: ['Montserrat-SemiBold', 'sans-serif'],
        title7: ['Montserrat-SemiBold', 'sans-serif'],
        caption: ['Montserrat-Medium', 'sans-serif'],
        link: ['Montserrat-Medium', 'sans-serif'],
        subhead: ['Montserrat-Medium', 'sans-serif'],
        button: ['Montserrat-SemiBold', 'sans-serif'],
        intro: ['Montserrat-Medium', 'sans-serif'],
        label: ['Montserrat-SemiBold', 'sans-serif'],
        body: ['Montserrat-Regular', 'sans-serif'],
        bodybold: ['Montserrat-Medium', 'sans-serif'],
        'table-header': ['Montserrat-SemiBold', 'sans-serif'],
        'table-row': ['Montserrat-Regular', 'sans-serif']
      },
      minWidth: {
        '1/2': '50%',
        '3/4': '75%',
        button: '200px'
      },
      maxWidth: {
        card: '376px',
        form: '400px',
        sheet: '760px',
        popup: '480px',
        'popup-sm': '520px',
        'popup-md': '730px',
        'popup-lg': '1228px',
        '3/4': '75%',
        '9/10': '90%',
      },
      maxHeight: {
        dropdown: '317px',
        header1: '376px',
        form: '400px',
        mailto: '128px'
      }
    }
  },
  variants: {
    extend: {
      borderColor: ['active', 'hover', 'disabled'],
      borderWidth: ['active', 'hover', 'disabled'],
      ringColor: ['hover'],
      ringWidth: ['hover'],
      ringOpacity: ['hover'],
      ringOffsetColor: ['hover'],
      ringOffsetWidth: ['hover'],
      opacity: ['active', 'disabled'],
      padding: ['active'],
      boxShadow: ['active']
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        '.h-viewport': {
          height: 'calc(var(--vh, 1vh) * 100)'
        },
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'thin',

          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
      addUtilities(newUtilities)
    })
  ]
}
