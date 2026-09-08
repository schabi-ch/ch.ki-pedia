export default {
  eyebrow: 'Note legali',
  title: 'Protezione dei dati',
  responsible: {
    title: 'Titolare del trattamento',
    country: 'Svizzera',
    websiteLabel: 'wikimedia.ch',
    websiteUrl: 'https://wikimedia.ch/it/stampa-contatti/contact/',
  },
  chat: {
    title: 'Chatbot IA',
    body:
      'Sulle pagine delle voci (è così che vengono chiamati gli articoli di Wikipedia) è disponibile una chat assistita dall’IA (chatbot con IA). Quando si pone una domanda, questa viene trasmessa, insieme al contenuto della voce attualmente visualizzata, a un fornitore esterno di modelli linguistici IA (modelli basati sull’intelligenza artificiale come l’Large Language Model, LLM) al fine di generare una risposta. Attualmente la piattaforma utilizza un modello Google Gemini.',
    storage:
      'Noi non conserviamo direttamente i vostri messaggi inseriti nella chat. Il trattamento viene effettuato esclusivamente dal fornitore LLM, conformemente alla propria politica sulla protezione dei dati (privacy). Vi preghiamo di non trasmettere tramite la chat alcuna informazione personale o confidenziale.',
  },
  statistics: {
    title: 'Statistiche di utilizzo',
    body:
      'A fini di garanzia della qualità e di sviluppo continuo dell’offerta, raccogliamo statistiche di utilizzo anonimizzate. Vengono registrate, ad esempio, le voci consultate e la lingua in cui vengono lette.',
    aggregation:
      'Queste statistiche sono archiviate in forma aggregata e non consentono di risalire a singole persone. Non vengono messe in relazione con voi in qualità di utente.',
  },
  noFurtherData: {
    title: 'Nessun’altra raccolta di dati',
    body:
      'Oltre ai casi sopra descritti, nessun dato personale viene raccolto, conservato o trasmesso a terzi. Non viene utilizzato alcun cookie a fini di tracciamento o pubblicitari.',
  },
  contact: {
    title: 'Contatto per domande relative alla protezione dei dati',
    body:
      'Poiché non conserviamo alcun dato personale, non è possibile esercitare nei nostri confronti alcun diritto di accesso o di cancellazione. Per qualsiasi domanda relativa alla presente dichiarazione sulla protezione dei dati o al trattamento dei vostri messaggi inseriti nella chat da parte del fornitore LLM, potete contattarci tramite:',
    linkLabel: 'wikimedia.ch/it/stampa-contatti/contact',
    linkUrl: 'https://wikimedia.ch/it/stampa-contatti/contact/',
  },
  openSource: {
    title: 'Open Source',
    introductionBefore:
      'Il software alla base di questa applicazione web è open source e disponibile su GitHub. Potete consultare il codice sorgente, scaricarlo e utilizzarlo secondo i termini della licenza MIT. Ulteriori informazioni sono disponibili sulla pagina GitHub del progetto:',
    githubLabel: 'GitHub',
    githubUrl: 'https://github.com/schabi-ch/ch.ki-pedia',
    toolsIntroduction:
      'Per il funzionamento di questa pagina sono state utilizzate numerose librerie e numerosi strumenti open source, tra cui:',
    descriptions: {
      vue: 'Un framework JavaScript progressivo per la creazione di interfacce utente.',
      quasar: 'Un framework per lo sviluppo di applicazioni Vue.js dotato di un’ampia gamma di componenti d’interfaccia.',
      accessibleFonts: 'Caratteri tipografici per una leggibilità ottimale e una visualizzazione più accessibile.',
      interfaceFonts: 'Caratteri tipografici per l’interfaccia utente.',
      pinia: 'Una libreria per la gestione dello stato (store) dell’applicazione web.',
      router: 'La libreria di routing per la navigazione all’interno dell’applicazione.',
      i18n: 'Una libreria per il multilinguismo dell’interfaccia utente.',
      axios: 'Una libreria HTTP per la comunicazione tra frontend, backend e interfacce esterne.',
      qmarkdown: 'Un componente per la visualizzazione di contenuti Markdown nell’interfaccia.',
      dompurify: 'Una libreria per la pulizia sicura di contenuti HTML.',
      markdownIt: 'Un analizzatore (parser) Markdown per la visualizzazione e l’esportazione di testi.',
      docx: 'Una libreria per l’esportazione di contenuti in formato documento Word.',
      nest: 'Un framework Node.js per il backend e la messa a disposizione dell’API.',
      rxjs: 'Una libreria per la programmazione reattiva nel backend.',
      cheerio: 'Una libreria per l’analisi e l’elaborazione dell’HTML proveniente dagli articoli di Wikipedia.',
      turndown: 'Una libreria per la conversione da HTML a Markdown.',
      mysql: 'Un client MySQL per la memorizzazione dei dati statistici.',
      zod: 'Una libreria per la validazione di configurazioni e dati strutturati.',
      genai: 'Un SDK per il collegamento delle funzioni IA a Gemini.',
      typescript: 'Un’estensione tipizzata di JavaScript, utilizzata nel frontend e nel backend.',
      tooling: 'Strumenti per lo sviluppo, la garanzia della qualità, la formattazione e i test.',
    },
  },
};
