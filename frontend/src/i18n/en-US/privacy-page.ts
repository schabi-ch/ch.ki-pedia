export default {
  eyebrow: 'Legal notice',
  title: 'Data protection',
  responsible: {
    title: 'Data controller',
    country: 'Switzerland',
    websiteLabel: 'wikimedia.ch',
    websiteUrl: 'https://wikimedia.ch/en/press-contact/contact/',
  },
  chat: {
    title: 'AI chatbot',
    body:
      'An AI-assisted chat is available on article pages. When you ask it a question, the question is sent, together with the content of the article currently displayed, to an external AI language model (Large Language Model, LLM) provider in order to generate a response. The platform currently uses a Google Gemini model from Alphabet.',
    storage:
      'We do not store your chat inputs ourselves. Processing is carried out exclusively by the relevant LLM provider, in accordance with its own privacy policy. Please do not share any personal or confidential information via the chat.',
  },
  statistics: {
    title: 'Usage statistics',
    body:
      'For quality assurance purposes and the ongoing development of the service, we collect anonymized usage statistics. For example, we record which articles are accessed and the language in which they are read.',
    aggregation:
      'These statistics are stored in aggregated form and do not allow any individual to be identified. They are not linked to you as a user.',
  },
  noFurtherData: {
    title: 'No other data collection',
    body:
      'Beyond the cases described above, no personal data is collected, stored, or shared with third parties. No cookies are used for tracking or advertising purposes.',
  },
  contact: {
    title: 'Contact for data protection questions',
    body:
      'Since we do not store any personal data, no right of access or deletion can be exercised with us. For any questions regarding this privacy statement or the processing of your chat inputs by the LLM provider, please contact us via the details provided here:',
    linkLabel: 'wikimedia.ch/en/press-contact/contact',
    linkUrl: 'https://wikimedia.ch/en/press-contact/contact/',
  },
  openSource: {
    title: 'Open source',
    introductionBefore:
      'The software behind this web application is open source and available on GitHub. You can view the source code, download it, and use it under the terms of the MIT license. More information can be found on the project’s GitHub page:',
    githubLabel: 'GitHub',
    githubUrl: 'https://github.com/schabi-ch/ch.ki-pedia',
    toolsIntroduction: 'A large number of open-source libraries and tools were used to build this page, including:',
    descriptions: {
      vue: 'A progressive JavaScript framework for building user interfaces.',
      quasar: 'A framework for developing Vue.js applications with a wide range of UI components.',
      accessibleFonts: 'Fonts for optimal readability and more accessible display.',
      interfaceFonts: 'Fonts used for the user interface.',
      pinia: 'A state management library (store) for the web application.',
      router: 'The routing library for navigation within the application.',
      i18n: 'A library for multilingual support in the user interface.',
      axios: 'An HTTP library for communication between the frontend, backend, and external interfaces.',
      qmarkdown: 'A component for displaying Markdown content in the interface.',
      dompurify: 'A library for safely sanitizing HTML content.',
      markdownIt: 'A Markdown parser for displaying and exporting text.',
      docx: 'A library for exporting content to Word document format.',
      nest: 'A Node.js framework for the backend and for providing the API.',
      rxjs: 'A library for reactive programming in the backend.',
      cheerio: 'A library for parsing and processing HTML from Wikipedia articles.',
      turndown: 'A library for converting HTML to Markdown.',
      mysql: 'A MySQL client for storing statistical data.',
      zod: 'A library for validating configurations and structured data.',
      genai: 'An SDK for connecting AI functions to Gemini.',
      typescript: 'A typed extension of JavaScript, used in the frontend and backend.',
      tooling: 'Tools for development, quality assurance, formatting, and testing.',
    },
  },
};
