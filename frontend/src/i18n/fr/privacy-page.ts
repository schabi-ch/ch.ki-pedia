export default {
  eyebrow: 'Mentions légales',
  title: 'Protection des données',
  responsible: {
    title: 'Responsable du traitement',
    country: 'Suisse',
    websiteLabel: 'wikimedia.ch',
    websiteUrl: 'https://wikimedia.ch/de/presse-kontakt/kontakt/',
  },
  chat: {
    title: 'Chatbot IA',
    body:
      'Sur les pages d’articles, un chat assisté par IA est mis à disposition. Lorsque vous y posez une question, celle-ci est transmise, avec le contenu de l’article actuellement affiché, à un fournisseur externe de modèle de langage IA (Large Language Model, LLM) afin de générer une réponse. Actuellement, la plateforme utilise un modèle Google Gemini d’Alphabet.',
    storage:
      'Nous ne stockons pas nous-mêmes vos saisies dans le chat. Le traitement est effectué exclusivement par le fournisseur de LLM concerné, conformément à sa propre politique de protection des données. Veuillez ne transmettre aucune information personnelle ou confidentielle via le chat.',
  },
  statistics: {
    title: 'Statistiques d’utilisation',
    body:
      'À des fins d’assurance qualité et de développement continu de l’offre, nous collectons des statistiques d’utilisation anonymisées. Sont par exemple consignés les articles consultés ainsi que la langue dans laquelle ils sont lus.',
    aggregation:
      'Ces statistiques sont stockées sous forme agrégée et ne permettent aucune identification de personnes individuelles. Elles ne sont pas mises en relation avec vous en tant qu’utilisateur ou utilisatrice.',
  },
  noFurtherData: {
    title: 'Aucune autre collecte de données',
    body:
      'Au-delà des cas décrits ci-dessus, aucune donnée à caractère personnel n’est collectée, stockée ou transmise à des tiers. Aucun cookie n’est utilisé à des fins de traçage ou de publicité.',
  },
  contact: {
    title: 'Contact pour les questions relatives à la protection des données',
    body:
      'Comme nous ne stockons aucune donnée à caractère personnel, aucun droit d’accès ou de suppression ne peut être exercé à notre égard. Pour toute question concernant la présente déclaration de protection des données ou le traitement de vos saisies dans le chat par le fournisseur de LLM, vous pouvez nous joindre via :',
    linkLabel: 'wikimedia.ch/fr/press-contact/contact',
    linkUrl: 'https://wikimedia.ch/fr/press-contact/contact/',
  },
  openSource: {
    title: 'Open Source',
    introductionBefore:
      'Le logiciel qui sous-tend cette application web est open source et disponible sur GitHub. Vous pouvez consulter le code source, le télécharger et l’utiliser selon les conditions de la licence MIT. Vous trouverez de plus amples informations sur la page GitHub du projet :',
    githubLabel: 'GitHub',
    githubUrl: 'https://github.com/schabi-ch/ch.ki-pedia',
    toolsIntroduction:
      'Pour que cette page fonctionne, un grand nombre de bibliothèques et d’outils open source ont été utilisés, parmi lesquels :',
    descriptions: {
      vue: 'Un framework JavaScript progressif pour la création d’interfaces utilisateur.',
      quasar: 'Un framework pour le développement d’applications Vue.js doté d’un large éventail de composants d’interface.',
      accessibleFonts: 'Des polices de caractères pour une lisibilité optimale et un affichage plus accessible.',
      interfaceFonts: 'Des polices de caractères pour l’interface utilisateur.',
      pinia: 'Une bibliothèque de gestion d’état (store) pour l’application web.',
      router: 'La bibliothèque de routage pour la navigation au sein de l’application.',
      i18n: 'Une bibliothèque pour le multilinguisme de l’interface utilisateur.',
      axios: 'Une bibliothèque HTTP pour la communication entre le frontend, le backend et les interfaces externes.',
      qmarkdown: 'Un composant pour l’affichage de contenus Markdown dans l’interface.',
      dompurify: 'Une bibliothèque pour le nettoyage sécurisé de contenus HTML.',
      markdownIt: 'Un analyseur (parser) Markdown pour l’affichage et l’exportation de textes.',
      docx: 'Une bibliothèque pour l’exportation de contenus au format document Word.',
      nest: 'Un framework Node.js pour le backend et la mise à disposition de l’API.',
      rxjs: 'Une bibliothèque pour la programmation réactive dans le backend.',
      cheerio: 'Une bibliothèque pour l’analyse et le traitement du HTML issu des articles de Wikipédia.',
      turndown: 'Une bibliothèque pour la conversion de HTML en Markdown.',
      mysql: 'Un client MySQL pour le stockage des données statistiques.',
      zod: 'Une bibliothèque pour la validation de configurations et de données structurées.',
      genai: 'Un SDK pour la connexion des fonctions IA à Gemini.',
      typescript: 'Une extension typée de JavaScript, utilisée dans le frontend et le backend.',
      tooling: 'Des outils pour le développement, l’assurance qualité, le formatage et les tests.',
    },
  },
};
