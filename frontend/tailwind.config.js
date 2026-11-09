/** @type {import('tailwindcss').Config} */
// Paleta baseada no design system da Oura (awesome-design-md): papel creme + família terra (verde, argila, ouro).
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f1e8',   // fundo papel creme
        cream: '#efe6d6',    // superfície creme mais forte
        surface: '#fffcf7',  // cards e inputs sobre o creme
        hairline: '#e1dcd3', // divisórias
        ink: '#1c1b1a',      // texto principal
        stone: '#4a4741',    // texto secundário / neutro de marca
        forest: '#224228',   // ação principal
        moss: '#2f5a36',     // hover da ação principal
        olive: '#5c6f5d',
        sage: '#849671',
        'sage-pale': '#ced4b8',
        clay: '#6b443d',     // acento marrom
        espresso: '#39221e', // marrom profundo (rodapé, faixas)
        gold: '#af751b',
        'gold-pale': '#ddbe78',
        tide: '#2a6f7b',     // azul-cerâmica: só em detalhes, contrasta com o verde
        'tide-pale': '#bcd6d9',
        danger: '#a3341f',   // erros
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        body: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,27,26,.04), 0 8px 24px -12px rgba(57,34,30,.18)',
        lift: '0 2px 4px rgba(28,27,26,.05), 0 18px 40px -16px rgba(57,34,30,.28)',
      },
    },
  },
  plugins: [],
}
