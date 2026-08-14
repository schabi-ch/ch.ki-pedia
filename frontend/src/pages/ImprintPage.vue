<template>
    <q-page class="legal-page imprint-page">
        <div class="legal-page__container">
            <q-card flat bordered class="legal-page__card">
                <q-card-section class="imprint-page__header">
                    <div class="legal-page__eyebrow">{{ $t('imprintPage.eyebrow') }}</div>
                    <h1 class="legal-page__title">{{ $t('imprintPage.title') }}</h1>
                </q-card-section>

                <q-separator />

                <q-card-section class="imprint-page__content">
                    <section class="partners" :aria-label="$t('imprintPage.partnersLabel')">
                        <article class="partner">
                            <img :src="wikimediaEduLogo" alt="Wikimedia CH"
                                class="partner__logo partner__logo--wikimedia" />
                            <h2>Wikimedia CH</h2>
                            <address>
                                Wikimedia CH<br />
                                c/o Gilles Benedict<br />
                                Via Ludovico Ariosto 6<br />
                                CH-6900 Lugano<br />
                                {{ $t('imprintPage.country') }}
                            </address>
                        </article>

                        <article class="partner">
                            <img :src="schabiLogo" alt="Schabi.ch" class="partner__logo partner__logo--schabi" />
                            <h2>Schabi.ch</h2>
                            <address>
                                Schabi.ch<br />
                                c/o Christof Müller<br />
                                Marktgasse 37<br />
                                CH-8400 Winterthur<br />
                                {{ $t('imprintPage.country') }}
                            </address>
                        </article>
                    </section>

                    <section class="imprint-section" aria-labelledby="team-title">
                        <div class="imprint-section__heading">
                            <div class="imprint-section__icon" aria-hidden="true">
                                <q-icon name="groups" />
                            </div>
                            <h2 id="team-title">{{ $t('imprintPage.teamTitle') }}</h2>
                        </div>
                        <div class="roles">
                            <div v-for="role in roleIds" :key="role" class="role">
                                <h3>{{ $t(`imprintPage.${role}.title`) }}</h3>
                                <p v-for="person in rolePeople[role]" :key="person">
                                    {{ $t(`imprintPage.${role}.${person}`) }}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section class="imprint-section" aria-labelledby="contact-title">
                        <div class="imprint-section__heading">
                            <div class="imprint-section__icon" aria-hidden="true">
                                <q-icon name="contact_mail" />
                            </div>
                            <h2 id="contact-title">{{ $t('imprintPage.contact.title') }}</h2>
                        </div>
                        <div class="contact-links">
                            <a class="legal-link" :href="$t('imprintPage.contact.wikimediaUrl')" target="_blank"
                                rel="noopener noreferrer">
                                <q-icon name="language" aria-hidden="true" />
                                {{ $t('imprintPage.contact.wikimediaLabel') }}
                            </a>
                            <a class="legal-link" href="mailto:support@schabi.ch">
                                <q-icon name="mail" aria-hidden="true" />
                                support@schabi.ch
                            </a>
                        </div>
                    </section>

                    <section class="imprint-section" aria-labelledby="notice-title">
                        <div class="imprint-section__heading">
                            <div class="imprint-section__icon imprint-section__icon--neutral" aria-hidden="true">
                                <q-icon name="info" />
                            </div>
                            <h2 id="notice-title">{{ $t('imprintPage.notice.title') }}</h2>
                        </div>
                        <p>
                            {{ $t('imprintPage.notice.beforeWikimedia') }}
                            <a class="legal-link" :href="$t('imprintPage.notice.wikimediaUrl')" target="_blank"
                                rel="noopener noreferrer">{{ $t('imprintPage.notice.wikimediaLabel') }}</a>,
                            {{ $t('imprintPage.notice.between') }}
                            <a class="legal-link" :href="$t('imprintPage.notice.schabiUrl')" target="_blank"
                                rel="noopener noreferrer">{{ $t('imprintPage.notice.schabiLabel') }}</a>,
                            {{ $t('imprintPage.notice.after') }}
                        </p>
                    </section>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import schabiLogo from 'src/assets/img/schabi-logo.jpg';
import wikimediaEduLogo from 'src/assets/img/wikimedia-edu.jpg';

const roleIds = ['conception', 'design', 'editorial'] as const;
const rolePeople: Record<(typeof roleIds)[number], readonly string[]> = {
    conception: ['vivian', 'christof', 'stanley'],
    design: ['christof'],
    editorial: ['vivian', 'christof', 'stanley', 'jeanMarc'],
};
</script>

<style scoped lang="scss">
.imprint-page__header {
    padding: 36px 40px 32px;
}

.imprint-page__content {
    padding: 40px;
}

.partners {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
}

.partner {
    min-width: 0;
    padding: 26px;
    border: 1px solid rgba(70, 80, 102, 0.16);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.62);
}

.partner__logo {
    display: block;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    object-position: left center;
}

.partner__logo--wikimedia {
    height: 72px;
}

.partner__logo--schabi {
    height: 42px;
    margin: 15px 0;
}

.partner h2 {
    margin: 22px 0 10px;
    font-size: 1.2rem;
}

.partner address {
    font-style: normal;
    line-height: 1.65;
}

.imprint-section {
    max-width: 72ch;
    margin-top: 44px;
    padding-top: 40px;
    border-top: 1px solid rgba(70, 80, 102, 0.18);
}

.imprint-section__heading {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 22px;
}

.imprint-section__heading h2 {
    margin: 0;
    font-size: 1.45rem;
    line-height: 1.25;
}

.imprint-section__icon {
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

.imprint-section__icon--neutral {
    background: #344054;
    box-shadow: 0 8px 22px rgba(52, 64, 84, 0.18);
}

.roles {
    display: grid;
    grid-template-columns: 1fr;
    gap: 26px 34px;
}

.role h3 {
    margin: 0 0 10px;
    color: #a52222;
    font-size: 0.84rem;
    text-transform: uppercase;
}

.role p {
    margin: 0 0 5px;
    line-height: 1.55;
}

.contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
}

.legal-link {
    color: #7b2f99;
    font-weight: 600;
    overflow-wrap: anywhere;
    text-decoration: underline;
    text-underline-offset: 0.14em;
}

.contact-links .legal-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
}

.imprint-section>p {
    margin: 0;
    line-height: 1.72;
}

.body--dark .partner {
    background: rgba(36, 36, 36, 0.58);
}

.body--dark .role h3 {
    color: #f2a7a7;
}

.body--dark .legal-link {
    color: #d9a7ee;
}

@media (max-width: 600px) {

    .imprint-page__header,
    .imprint-page__content {
        padding-right: 22px;
        padding-left: 22px;
    }

    .imprint-page__header {
        padding-top: 28px;
    }

    .partners,
    .roles {
        grid-template-columns: 1fr;
    }

    .partner {
        padding: 20px;
    }

    .imprint-section__heading {
        align-items: flex-start;
    }

    .imprint-section__icon {
        flex-basis: 46px;
        width: 46px;
        height: 46px;
        font-size: 1.45rem;
    }

    .imprint-section__heading h2 {
        font-size: 1.25rem;
    }
}
</style>
