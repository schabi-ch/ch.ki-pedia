<template>
  <q-page class="legal-page about-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section class="about-page__header">
          <div class="legal-page__eyebrow">{{ $t('about.eyebrow') }}</div>
          <h1 class="legal-page__title">{{ $t('about.title') }}</h1>
          <div class="about-page__intro">
            <p>{{ $t('about.introduction.wikipedia') }}</p>
            <p>{{ $t('about.introduction.purpose') }}</p>
            <p>{{ $t('about.introduction.assistant') }}</p>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="legal-page__section about-page__content">
          <section class="about-section" aria-labelledby="simplify-title">
            <div class="about-section__heading">
              <div class="about-section__icon" aria-hidden="true">
                <q-icon name="auto_fix_high" />
              </div>
              <div>
                <div class="about-section__action">{{ $t('about.simplify.action') }}</div>
                <h2 id="simplify-title">{{ $t('about.simplify.title') }}</h2>
              </div>
            </div>
            <p>{{ $t('about.simplify.introduction') }}</p>
            <p>{{ $t('about.simplify.byGrade') }}</p>
            <p>{{ $t('about.simplify.learningTools') }}</p>
            <p>{{ $t('about.simplify.originalAccess') }}</p>
            <p>{{ $t('about.simplify.byLanguageLevel') }}</p>
          </section>

          <section class="about-section" aria-labelledby="reading-assistant-title">
            <div class="about-section__heading">
              <div class="about-section__icon" aria-hidden="true">
                <q-icon name="chat" />
              </div>
              <div>
                <div class="about-section__action">{{ $t('about.readingAssistant.action') }}</div>
                <h2 id="reading-assistant-title">{{ $t('about.readingAssistant.title') }}</h2>
              </div>
            </div>
            <p>{{ $t('about.readingAssistant.introduction') }}</p>
            <p>
              {{ $t('about.readingAssistant.limitationBefore') }}
              <strong>{{ $t('about.readingAssistant.limitationEmphasis') }}</strong>
              {{ $t('about.readingAssistant.limitationAfter') }}
            </p>
            <p>{{ $t('about.readingAssistant.sources') }}</p>
            <p>{{ $t('about.readingAssistant.sourceLiteracy') }}</p>
            <p>{{ $t('about.readingAssistant.teachingValue') }}</p>
            <p>{{ $t('about.readingAssistant.outsideSchool') }}</p>
            <p>{{ $t('about.readingAssistant.summary') }}</p>
          </section>

          <q-banner rounded class="about-note">
            <template #avatar>
              <q-icon name="info" size="md" />
            </template>
            <strong>{{ $t('about.cycleTwo.label') }}:</strong>
            {{ $t('about.cycleTwo.before') }}
            <strong>{{ $t('about.cycleTwo.emphasis') }}</strong>
            {{ $t('about.cycleTwo.after') }}
          </q-banner>

          <section class="about-section about-section--teachers" aria-labelledby="youth-protection-title">
            <div class="about-section__heading">
              <div class="about-section__icon about-section__icon--neutral" aria-hidden="true">
                <q-icon name="school" />
              </div>
              <div>
                <div class="about-section__action">{{ $t('about.youthProtection.audience') }}</div>
                <h2 id="youth-protection-title">{{ $t('about.youthProtection.title') }}</h2>
              </div>
            </div>
            <p>{{ $t('about.youthProtection.introduction') }}</p>
            <p>{{ $t('about.youthProtection.responsibility') }}</p>

            <h3>{{ $t('about.youthProtection.filteringTitle') }}</h3>
            <p>{{ $t('about.youthProtection.filtering') }}</p>

            <h3>{{ $t('about.youthProtection.legalSituationTitle') }}</h3>
            <p>{{ $t('about.youthProtection.legalSituation') }}</p>

            <h3>{{ $t('about.youthProtection.legalContextTitle') }}</h3>
            <p>{{ $t('about.youthProtection.legalContext') }}</p>

            <h3>{{ $t('about.youthProtection.editingTitle') }}</h3>
            <p>{{ $t('about.youthProtection.editing') }}</p>
          </section>

          <section class="about-section" aria-labelledby="privacy-title">
            <div class="about-section__heading">
              <div class="about-section__icon about-section__icon--neutral" aria-hidden="true">
                <q-icon name="shield" />
              </div>
              <h2 id="privacy-title">{{ $t('about.privacy.title') }}</h2>
            </div>
            <p>{{ $t('about.privacy.anonymous') }}</p>
            <p class="about-page__warning">
              <q-icon name="warning" aria-hidden="true" />
              <strong>{{ $t('about.privacy.warning') }}</strong>
            </p>
          </section>
        </q-card-section>

        <section class="student-info" aria-labelledby="student-info-title">
          <div class="student-info__header">
            <div class="student-info__illustration" aria-hidden="true">
              <q-icon name="menu_book" />
              <q-icon name="sentiment_satisfied_alt" class="student-info__face" />
            </div>
            <div>
              <div class="student-info__eyebrow">{{ $t('about.students.title') }}</div>
              <h2 id="student-info-title">{{ $t('about.students.subtitle') }}</h2>
            </div>
          </div>

          <div class="student-info__body">
            <h3>{{ $t('about.students.greeting') }}</h3>
            <p>{{ $t('about.students.welcome') }}</p>

            <h3>{{ $t('about.students.noFiltersTitle') }}</h3>
            <p>{{ $t('about.students.noFilters') }}</p>
            <p>{{ $t('about.students.sensitiveContent') }}</p>
            <p>{{ $t('about.students.seekHelp') }}</p>

            <h3>{{ $t('about.students.dataSafeTitle') }}</h3>
            <p>{{ $t('about.students.dataSafe') }}</p>

            <div class="student-info__rule">
              <q-icon name="privacy_tip" aria-hidden="true" />
              <div>
                <h3>{{ $t('about.students.ruleTitle') }}</h3>
                <p>{{ $t('about.students.rule') }}</p>
              </div>
            </div>
          </div>
        </section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.about-page__header {
  padding: 36px 40px 32px;
}

.about-page__intro {
  max-width: 72ch;
  margin-top: 24px;
}

.about-page__intro p,
.about-page__content p,
.student-info p {
  margin: 0 0 14px;
  line-height: 1.72;
}

.about-page__content {
  padding: 8px 40px 40px;
}

.about-section {
  max-width: 72ch;
  padding-top: 40px;
}

.about-section+.about-section {
  margin-top: 40px;
  border-top: 1px solid rgba(70, 80, 102, 0.18);
}

.about-section__heading {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.about-section__heading h2 {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.25;
}

.about-section__icon {
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

.about-section__icon--neutral {
  background: #344054;
  box-shadow: 0 8px 22px rgba(52, 64, 84, 0.18);
}

.about-section__action,
.student-info__eyebrow {
  margin-bottom: 3px;
  color: #a52222;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.about-section h3 {
  margin: 30px 0 10px;
  font-size: 1.08rem;
  line-height: 1.4;
}

.about-note {
  max-width: 72ch;
  margin-top: 40px;
  border: 1px solid #efcaca;
  background: #fff4f3;
  color: #552020;
  line-height: 1.65;
}

.about-section--teachers {
  max-width: none;
}

.about-page__warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px !important;
  color: #8f1d1d;
}

.about-page__warning .q-icon {
  margin-top: 3px;
  font-size: 1.3rem;
}

.student-info {
  padding: 40px;
  border-radius: 0 0 28px 28px;
  background: #edf7f2;
  color: #18352a;
}

.student-info__header {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 72ch;
  margin-bottom: 24px;
}

.student-info__header h2 {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.25;
}

.student-info__eyebrow {
  color: #257052;
}

.student-info__illustration {
  position: relative;
  display: grid;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  place-items: end center;
  border-radius: 50%;
  background: #fff;
  color: #257052;
  font-size: 2.35rem;
  box-shadow: 0 8px 22px rgba(37, 112, 82, 0.12);
}

.student-info__face {
  position: absolute;
  top: 5px;
  font-size: 1.45rem;
}

.student-info__body {
  max-width: 72ch;
}

.student-info__body h3 {
  margin: 28px 0 10px;
  font-size: 1.12rem;
}

.student-info__body>h3:first-child {
  margin-top: 0;
}

.student-info__rule {
  display: flex;
  gap: 14px;
  margin-top: 30px;
  padding: 20px;
  border-left: 4px solid #c62828;
  background: #fff;
  color: #3e2020;
}

.student-info__rule>.q-icon {
  flex: 0 0 auto;
  color: #c62828;
  font-size: 1.7rem;
}

.student-info__rule h3 {
  margin: 0 0 8px;
}

.student-info__rule p {
  margin-bottom: 0;
}

.body--dark .about-section__action {
  color: #f2a7a7;
}

.body--dark .about-note {
  border-color: rgba(242, 167, 167, 0.34);
  background: rgba(107, 31, 31, 0.35);
  color: #f3d7d7;
}

.body--dark .student-info {
  background: #172923;
  color: #d8ebe3;
}

.body--dark .student-info__eyebrow {
  color: #84c9ae;
}

.body--dark .student-info__illustration,
.body--dark .student-info__rule {
  background: #223830;
}

.body--dark .student-info__rule {
  color: #f2dddd;
}

@media (max-width: 600px) {

  .about-page__header,
  .about-page__content,
  .student-info {
    padding-right: 22px;
    padding-left: 22px;
  }

  .about-page__header {
    padding-top: 28px;
  }

  .about-section__heading,
  .student-info__header {
    align-items: flex-start;
  }

  .about-section__icon {
    flex-basis: 46px;
    width: 46px;
    height: 46px;
    font-size: 1.45rem;
  }

  .about-section__heading h2,
  .student-info__header h2 {
    font-size: 1.25rem;
  }

  .student-info__illustration {
    flex-basis: 54px;
    width: 54px;
    height: 54px;
    font-size: 2rem;
  }
}
</style>
