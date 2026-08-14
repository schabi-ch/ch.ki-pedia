<template>
    <q-page class="legal-page privacy-page">
        <div class="legal-page__container">
            <q-card flat bordered class="legal-page__card">
                <q-card-section class="privacy-page__header">
                    <div class="legal-page__eyebrow">{{ $t('privacyPage.eyebrow') }}</div>
                    <h1 class="legal-page__title">{{ $t('privacyPage.title') }}</h1>
                </q-card-section>

                <q-separator />

                <q-card-section class="privacy-page__content">
                    <section class="responsible" aria-labelledby="responsible-title">
                        <div class="legal-section__heading">
                            <div class="legal-section__icon" aria-hidden="true">
                                <q-icon name="apartment" />
                            </div>
                            <h2 id="responsible-title">{{ $t('privacyPage.responsible.title') }}</h2>
                        </div>
                        <address>
                            <strong>Wikimedia CH</strong><br />
                            c/o Gilles Benedict<br />
                            Via Ludovico Ariosto 6<br />
                            CH-6900 Lugano<br />
                            {{ $t('privacyPage.responsible.country') }}
                        </address>
                        <a class="legal-link" :href="$t('privacyPage.responsible.websiteUrl')" target="_blank"
                            rel="noopener noreferrer">{{ $t('privacyPage.responsible.websiteLabel') }}<q-icon
                                name="open_in_new" /></a>
                    </section>

                    <section v-for="section in privacySectionIds" :key="section" class="legal-section"
                        :aria-labelledby="`${section}-title`">
                        <div class="legal-section__heading">
                            <div class="legal-section__icon" aria-hidden="true">
                                <q-icon :name="privacySectionIcons[section]" />
                            </div>
                            <h2 :id="`${section}-title`">{{ $t(`privacyPage.${section}.title`) }}</h2>
                        </div>
                        <p>{{ $t(`privacyPage.${section}.body`) }}</p>
                        <p v-if="section === 'chat'">{{ $t('privacyPage.chat.storage') }}</p>
                        <p v-else-if="section === 'statistics'">{{ $t('privacyPage.statistics.aggregation') }}</p>
                        <p v-else-if="section === 'contact'">
                            <a class="legal-link" :href="$t('privacyPage.contact.linkUrl')" target="_blank"
                                rel="noopener noreferrer">{{ $t('privacyPage.contact.linkLabel') }}<q-icon
                                    name="open_in_new" /></a>
                        </p>
                    </section>

                    <section class="legal-section legal-section--open-source" aria-labelledby="open-source-title">
                        <div class="legal-section__heading">
                            <div class="legal-section__icon legal-section__icon--neutral" aria-hidden="true">
                                <q-icon name="code" />
                            </div>
                            <h2 id="open-source-title">{{ $t('privacyPage.openSource.title') }}</h2>
                        </div>
                        <p>
                            {{ $t('privacyPage.openSource.introductionBefore') }}
                            <a class="legal-link" :href="$t('privacyPage.openSource.githubUrl')" target="_blank"
                                rel="noopener noreferrer">{{ $t('privacyPage.openSource.githubLabel') }}<q-icon
                                    name="open_in_new" /></a>.
                        </p>
                        <p>{{ $t('privacyPage.openSource.toolsIntroduction') }}</p>

                        <ul class="library-list">
                            <li v-for="library in libraries" :key="library.key">
                                <div class="library-list__names">
                                    <template v-for="(item, index) in library.items" :key="item.label">
                                        <span v-if="index > 0">{{ index === library.items.length - 1 ? ' & ' : ', '
                                            }}</span>
                                        <a class="legal-link" :href="item.url" target="_blank"
                                            rel="noopener noreferrer">
                                            {{ item.label }}
                                        </a>
                                    </template>
                                </div>
                                <p>{{ $t(`privacyPage.openSource.descriptions.${library.key}`) }}</p>
                            </li>
                        </ul>
                    </section>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
const privacySectionIds = ['chat', 'statistics', 'noFurtherData', 'contact'] as const;
const privacySectionIcons: Record<(typeof privacySectionIds)[number], string> = {
    chat: 'chat',
    statistics: 'bar_chart',
    noFurtherData: 'privacy_tip',
    contact: 'contact_support',
};

interface LibraryLink {
    label: string;
    url: string;
}

interface LibraryEntry {
    key: string;
    items: LibraryLink[];
}

const libraries: LibraryEntry[] = [
    { key: 'vue', items: [{ label: 'Vue.js', url: 'https://vuejs.org/' }] },
    { key: 'quasar', items: [{ label: 'Quasar Framework', url: 'https://quasar.dev/' }] },
    {
        key: 'accessibleFonts',
        items: [
            { label: 'Luciole', url: 'https://www.luciole-vision.com/' },
            { label: 'OpenDyslexic', url: 'https://opendyslexic.org/' },
        ],
    },
    {
        key: 'interfaceFonts',
        items: [
            { label: 'Inter', url: 'https://rsms.me/inter/' },
            { label: 'Space Grotesk', url: 'https://fonts.google.com/specimen/Space+Grotesk' },
        ],
    },
    { key: 'pinia', items: [{ label: 'Pinia', url: 'https://pinia.vuejs.org/' }] },
    { key: 'router', items: [{ label: 'Vue Router', url: 'https://router.vuejs.org/' }] },
    { key: 'i18n', items: [{ label: 'Vue I18n', url: 'https://vue-i18n.intlify.dev/' }] },
    { key: 'axios', items: [{ label: 'Axios', url: 'https://axios-http.com/' }] },
    {
        key: 'qmarkdown',
        items: [{ label: 'Quasar QMarkdown', url: 'https://github.com/quasarframework/quasar-ui-qmarkdown' }],
    },
    { key: 'dompurify', items: [{ label: 'DOMPurify', url: 'https://github.com/cure53/DOMPurify' }] },
    { key: 'markdownIt', items: [{ label: 'markdown-it', url: 'https://github.com/markdown-it/markdown-it' }] },
    {
        key: 'docx',
        items: [{ label: 'html-docx-js-typescript', url: 'https://github.com/mark-beeby/html-docx-js-typescript' }],
    },
    { key: 'nest', items: [{ label: 'NestJS', url: 'https://nestjs.com/' }] },
    { key: 'rxjs', items: [{ label: 'RxJS', url: 'https://rxjs.dev/' }] },
    { key: 'cheerio', items: [{ label: 'Cheerio', url: 'https://cheerio.js.org/' }] },
    { key: 'turndown', items: [{ label: 'Turndown', url: 'https://github.com/mixmark-io/turndown' }] },
    { key: 'mysql', items: [{ label: 'mysql2', url: 'https://sidorares.github.io/node-mysql2/' }] },
    { key: 'zod', items: [{ label: 'Zod', url: 'https://zod.dev/' }] },
    { key: 'genai', items: [{ label: 'Google GenAI SDK', url: 'https://github.com/googleapis/js-genai' }] },
    { key: 'typescript', items: [{ label: 'TypeScript', url: 'https://www.typescriptlang.org/' }] },
    {
        key: 'tooling',
        items: [
            { label: 'Vite', url: 'https://vite.dev/' },
            { label: 'ESLint', url: 'https://eslint.org/' },
            { label: 'Prettier', url: 'https://prettier.io/' },
            { label: 'Jest', url: 'https://jestjs.io/' },
        ],
    },
];
</script>

<style scoped lang="scss">
.privacy-page__header {
    padding: 36px 40px 32px;
}

.privacy-page__content {
    padding: 8px 40px 48px;
}

.responsible,
.legal-section {
    max-width: 72ch;
    padding-top: 40px;
}

.legal-section {
    margin-top: 40px;
    border-top: 1px solid rgba(70, 80, 102, 0.18);
}

.legal-section__heading {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 22px;
}

.legal-section__heading h2 {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.25;
}

.legal-section__icon {
    display: grid;
    flex: 0 0 52px;
    width: 52px;
    height: 52px;
    place-items: center;
    border-radius: 50%;
    background: #c62828;
    color: #fff;
    font-size: 1.65rem;
    box-shadow: 0 8px 22px rgba(198, 40, 40, 0.22);
}

.legal-section__icon--neutral {
    background: #344054;
    box-shadow: 0 8px 22px rgba(52, 64, 84, 0.18);
}

.responsible address {
    margin: 0 0 12px 68px;
    font-style: normal;
    line-height: 1.65;
}

.responsible>.legal-link {
    margin-left: 68px;
}

.legal-section p {
    margin: 0 0 14px;
    line-height: 1.72;
}

.legal-link {
    color: #7b2f99;
    font-weight: 600;
    overflow-wrap: anywhere;
    text-decoration: underline;
    text-underline-offset: 0.14em;
}

.legal-link .q-icon {
    margin-left: 3px;
    font-size: 0.85em;
}

.library-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 28px;
    margin: 26px 0 0;
    padding: 0;
    list-style: none;
}

.library-list li {
    padding: 14px 0;
    border-top: 1px solid rgba(70, 80, 102, 0.14);
}

.library-list__names {
    font-weight: 700;
}

.library-list p {
    margin: 5px 0 0;
    color: #5a6478;
    font-size: 0.92rem;
    line-height: 1.55;
}

.body--dark .legal-link {
    color: #d9a7ee;
}

.body--dark .library-list p {
    color: #b9c1cf;
}

@media (max-width: 600px) {

    .privacy-page__header,
    .privacy-page__content {
        padding-right: 22px;
        padding-left: 22px;
    }

    .privacy-page__header {
        padding-top: 28px;
    }

    .legal-section__heading {
        align-items: flex-start;
    }

    .legal-section__icon {
        flex-basis: 46px;
        width: 46px;
        height: 46px;
        font-size: 1.45rem;
    }

    .legal-section__heading h2 {
        font-size: 1.25rem;
    }

    .responsible address,
    .responsible>.legal-link {
        margin-left: 0;
    }

    .library-list {
        grid-template-columns: 1fr;
    }
}
</style>
