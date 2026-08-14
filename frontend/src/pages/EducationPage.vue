<template>
  <q-page class="legal-page education-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section class="education-page__header">
          <div class="legal-page__eyebrow">{{ $t('education.eyebrow') }}</div>
          <h1 class="legal-page__title">{{ $t('education.title') }}</h1>
          <p class="education-page__lead">{{ $t('education.lead') }}</p>
          <p class="education-page__introduction">{{ $t('education.introduction') }}</p>
        </q-card-section>

        <q-separator />

        <q-card-section class="legal-page__section education-page__content">
          <section class="education-section" aria-labelledby="subjects-title">
            <div class="education-section__heading">
              <div class="education-section__icon" aria-hidden="true">
                <q-icon name="category" />
              </div>
              <h2 id="subjects-title">{{ $t('education.subjects.title') }}</h2>
            </div>
            <p>{{ $t('education.subjects.introduction') }}</p>
            <ul class="education-list">
              <li v-for="subject in subjectIds" :key="subject">
                <q-icon :name="subjectIcons[subject]" aria-hidden="true" />
                <div>
                  <strong>{{ $t(`education.subjects.items.${subject}.title`) }}</strong>
                  <p>{{ $t(`education.subjects.items.${subject}.body`) }}</p>
                </div>
              </li>
            </ul>
            <p>{{ $t('education.subjects.differentiation') }}</p>
          </section>

          <section class="education-section" aria-labelledby="benefits-title">
            <div class="education-section__heading">
              <div class="education-section__icon" aria-hidden="true">
                <q-icon name="fact_check" />
              </div>
              <h2 id="benefits-title">{{ $t('education.benefits.title') }}</h2>
            </div>
            <p>{{ $t('education.benefits.introduction') }}</p>
            <ul class="education-list education-list--checks">
              <li v-for="benefit in benefitIds" :key="benefit">
                <q-icon name="check_circle" aria-hidden="true" />
                <div>
                  <strong>{{ $t(`education.benefits.items.${benefit}.title`) }}</strong>
                  <p>{{ $t(`education.benefits.items.${benefit}.body`) }}</p>
                </div>
              </li>
            </ul>
            <div class="education-summary">
              <strong>{{ $t('education.benefits.summaryTitle') }}</strong>
              <p>{{ $t('education.benefits.summary') }}</p>
            </div>
          </section>

          <section class="education-section" aria-labelledby="pisa-title">
            <div class="education-section__heading">
              <div class="education-section__icon education-section__icon--neutral" aria-hidden="true">
                <q-icon name="psychology" />
              </div>
              <h2 id="pisa-title">{{ $t('education.pisa.title') }}</h2>
            </div>
            <p>{{ $t('education.pisa.introduction') }}</p>
            <p>{{ $t('education.pisa.framework') }}</p>
            <ul class="education-list education-list--compact">
              <li v-for="competence in pisaIds" :key="competence">
                <q-icon name="arrow_forward" aria-hidden="true" />
                <div>
                  <strong>{{ $t(`education.pisa.items.${competence}.title`) }}</strong>
                  <p>{{ $t(`education.pisa.items.${competence}.body`) }}</p>
                </div>
              </li>
            </ul>
            <div class="education-summary education-summary--neutral">
              <strong>{{ $t('education.pisa.conclusionTitle') }}</strong>
              <p>{{ $t('education.pisa.conclusion') }}</p>
            </div>
          </section>
        </q-card-section>

        <section class="lesson" aria-labelledby="lesson-title">
          <div class="lesson__header">
            <div class="education-section__icon" aria-hidden="true">
              <q-icon name="route" />
            </div>
            <div>
              <div class="lesson__eyebrow">{{ $t('education.lesson.duration') }}</div>
              <h2 id="lesson-title">{{ $t('education.lesson.title') }}</h2>
            </div>
          </div>
          <p class="lesson__introduction">
            {{ $t('education.lesson.introductionBefore') }}
            (<a :href="$t('education.lesson.treeLinkUrl')" class="education-link" target="_blank"
              rel="noopener noreferrer">{{ $t('education.lesson.treeLinkLabel') }}<q-icon name="open_in_new" /></a>) –
            {{ $t('education.lesson.introductionAfter') }}
          </p>

          <ol class="lesson-steps">
            <li v-for="step in lessonStepIds" :key="step" class="lesson-step">
              <div class="lesson-step__number" aria-hidden="true">
                {{ $t(`education.lesson.steps.${step}.number`) }}
              </div>
              <div class="lesson-step__content">
                <h3>{{ $t(`education.lesson.steps.${step}.title`) }}</h3>
                <div class="lesson-step__meta">{{ $t(`education.lesson.steps.${step}.meta`) }}</div>
                <p>{{ $t(`education.lesson.steps.${step}.body`) }}</p>

                <template v-if="step === 'two'">
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.two.gradeTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.two.gradeBody') }}</p>
                  </div>
                  <div class="lesson-task">
                    <strong>{{ $t('education.lesson.steps.two.extraTitle') }}:</strong>
                    {{ $t('education.lesson.steps.two.extraBody') }}
                  </div>
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.two.languageTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.two.languageBody') }}</p>
                  </div>
                </template>

                <template v-else-if="step === 'three'">
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.three.glossaryTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.three.glossaryBody') }}</p>
                  </div>
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.three.quizTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.three.quizBody') }}</p>
                  </div>
                </template>

                <template v-else-if="step === 'four'">
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.four.gradeTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.four.gradeBody') }}</p>
                  </div>
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.four.languageTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.four.languageBody') }}</p>
                  </div>
                  <div class="lesson-task">
                    <strong>{{ $t('education.lesson.steps.four.taskTitle') }}:</strong>
                    {{ $t('education.lesson.steps.four.taskBody') }}
                  </div>
                </template>

                <template v-else-if="step === 'five'">
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.five.trickTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.five.trickBody') }}</p>
                  </div>
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.five.comparisonTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.five.comparisonBody') }}</p>
                  </div>
                  <div class="lesson-task">
                    <strong>{{ $t('education.lesson.steps.five.insightTitle') }}:</strong>
                    {{ $t('education.lesson.steps.five.insightBody') }}
                  </div>
                  <p>
                    {{ $t('education.lesson.steps.five.moonBefore') }}
                    (<a :href="$t('education.lesson.steps.five.moonLinkUrl')" class="education-link" target="_blank"
                      rel="noopener noreferrer">{{ $t('education.lesson.steps.five.moonLinkLabel') }}<q-icon
                        name="open_in_new" /></a>).
                    {{ $t('education.lesson.steps.five.moonAfter') }}
                  </p>
                  <div class="lesson-languages">
                    <strong>{{ $t('education.lesson.steps.five.languageVersions') }}:</strong>
                    <a v-for="language in moonLanguageIds" :key="language"
                      :href="$t(`education.lesson.steps.five.languageLinks.${language}Url`)" class="education-link"
                      target="_blank" rel="noopener noreferrer">{{
                        $t(`education.lesson.steps.five.languageLinks.${language}Label`) }}</a>
                  </div>
                  <div class="lesson-detail">
                    <strong>{{ $t('education.lesson.steps.five.realTitle') }}</strong>
                    <p>{{ $t('education.lesson.steps.five.realBody') }}</p>
                  </div>
                </template>
              </div>
            </li>
          </ol>
        </section>

        <section class="student-arguments" aria-labelledby="student-arguments-title">
          <div class="student-arguments__header">
            <div class="education-section__icon education-section__icon--student" aria-hidden="true">
              <q-icon name="campaign" />
            </div>
            <div>
              <div class="student-arguments__eyebrow">{{ $t('education.studentArguments.audience') }}</div>
              <h2 id="student-arguments-title">{{ $t('education.studentArguments.title') }}</h2>
            </div>
          </div>
          <p>{{ $t('education.studentArguments.introduction') }}</p>
          <ol class="student-reasons">
            <li v-for="reason in studentReasonIds" :key="reason">
              <span>{{ $t(`education.studentArguments.reasons.${reason}.number`) }}</span>
              <div>
                <strong>{{ $t(`education.studentArguments.reasons.${reason}.title`) }}</strong>
                <p>{{ $t(`education.studentArguments.reasons.${reason}.body`) }}</p>
              </div>
            </li>
          </ol>
          <div class="student-arguments__summary">
            <q-icon name="lightbulb" aria-hidden="true" />
            <div>
              <strong>{{ $t('education.studentArguments.summaryTitle') }}</strong>
              <p>{{ $t('education.studentArguments.summary') }}</p>
            </div>
          </div>
        </section>

        <q-card-section class="education-page__footer">
          <q-banner rounded class="education-note">
            <template #avatar>
              <q-icon name="info" size="md" />
            </template>
            <strong>{{ $t('education.implementationNote.title') }}:</strong>
            {{ $t('education.implementationNote.body') }}
          </q-banner>

          <section class="education-sources" aria-labelledby="sources-title">
            <h2 id="sources-title">{{ $t('education.sources.title') }}</h2>
            <ul>
              <li>
                <strong>{{ $t('education.sources.ailitLabel') }}:</strong>
                <a :href="$t('education.sources.ailitUrl')" class="education-link" target="_blank"
                  rel="noopener noreferrer">{{
                    $t('education.sources.ailitLinkLabel') }}<q-icon name="open_in_new" /></a>
                – {{ $t('education.sources.ailitAfter') }}
              </li>
              <li>
                <strong>{{ $t('education.sources.pisaLabel') }}:</strong>
                <a :href="$t('education.sources.pisaUrl')" class="education-link" target="_blank"
                  rel="noopener noreferrer">{{
                    $t('education.sources.pisaLinkLabel') }}<q-icon name="open_in_new" /></a>
                – {{ $t('education.sources.pisaAfter') }}
              </li>
            </ul>
          </section>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
const subjectIds = ['mint', 'society', 'arts', 'everyday', 'languages', 'media'] as const;
const subjectIcons: Record<(typeof subjectIds)[number], string> = {
  mint: 'science',
  society: 'public',
  arts: 'palette',
  everyday: 'savings',
  languages: 'translate',
  media: 'verified_user',
};
const benefitIds = [
  'curated',
  'traceable',
  'independent',
  'grounded',
  'active',
  'equity',
  'gifted',
  'oer',
  'images',
  'privacy',
] as const;
const pisaIds = ['verify', 'hallucinations', 'overtrust', 'judgement'] as const;
const lessonStepIds = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'] as const;
const moonLanguageIds = ['de', 'fr', 'it', 'en'] as const;
const studentReasonIds = ['reliable', 'verifiable', 'suitable', 'reusable', 'focused', 'capable', 'future'] as const;
</script>

<style scoped lang="scss">
.education-page__header {
  padding: 36px 40px 32px;
}

.education-page__lead {
  margin: 14px 0 0;
  color: #a52222;
  font-size: 1.12rem;
  font-weight: 700;
}

.education-page__introduction,
.education-page__content p,
.lesson p,
.student-arguments p {
  line-height: 1.72;
}

.education-page__introduction {
  max-width: 72ch;
  margin: 22px 0 0;
}

.education-page__content {
  padding: 8px 40px 48px;
}

.education-section {
  max-width: 72ch;
  padding-top: 40px;
}

.education-section+.education-section {
  margin-top: 40px;
  border-top: 1px solid rgba(70, 80, 102, 0.18);
}

.education-section__heading,
.lesson__header,
.student-arguments__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

.education-section__heading h2,
.lesson__header h2,
.student-arguments__header h2 {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.25;
}

.education-section__icon {
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

.education-section__icon--neutral {
  background: #344054;
  box-shadow: 0 8px 22px rgba(52, 64, 84, 0.18);
}

.education-section__icon--student {
  background: #257052;
  box-shadow: 0 8px 22px rgba(37, 112, 82, 0.18);
}

.education-list {
  margin: 24px 0;
  padding: 0;
  list-style: none;
}

.education-list li {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(70, 80, 102, 0.14);
}

.education-list li:first-child {
  border-top: 1px solid rgba(70, 80, 102, 0.14);
}

.education-list .q-icon {
  margin-top: 2px;
  color: #a52222;
  font-size: 1.3rem;
}

.education-list p {
  margin: 5px 0 0;
}

.education-list--checks .q-icon {
  color: #257052;
}

.education-list--compact li {
  padding: 13px 0;
}

.education-summary {
  margin-top: 28px;
  padding: 20px;
  border-left: 4px solid #c62828;
  background: #fff4f3;
  color: #552020;
}

.education-summary p {
  margin: 8px 0 0;
}

.education-summary--neutral {
  border-left-color: #344054;
  background: #f1f3f6;
  color: #263241;
}

.lesson {
  padding: 44px 40px 48px;
  background: #f7f4fa;
}

.lesson__eyebrow,
.student-arguments__eyebrow {
  margin-bottom: 3px;
  color: #a52222;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.lesson__introduction {
  max-width: 72ch;
  margin-bottom: 34px;
}

.lesson-steps {
  max-width: 72ch;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lesson-step {
  position: relative;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 18px;
  padding-bottom: 34px;
}

.lesson-step:not(:last-child)::before {
  position: absolute;
  top: 46px;
  bottom: 4px;
  left: 23px;
  width: 2px;
  background: rgba(165, 34, 34, 0.2);
  content: '';
}

.lesson-step__number {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 2px solid #c62828;
  border-radius: 50%;
  background: #fff;
  color: #a52222;
  font-size: 1.05rem;
  font-weight: 700;
}

.lesson-step__content h3 {
  margin: 2px 0 3px;
  font-size: 1.15rem;
  line-height: 1.35;
}

.lesson-step__meta {
  margin-bottom: 13px;
  color: #6b6373;
  font-size: 0.86rem;
  font-weight: 600;
}

.lesson-detail {
  margin-top: 18px;
  padding-left: 14px;
  border-left: 2px solid rgba(165, 34, 34, 0.24);
}

.lesson-detail p {
  margin: 5px 0 0;
}

.lesson-task {
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid #e0d5e8;
  background: #fff;
  line-height: 1.65;
}

.lesson-languages {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  margin: 14px 0 18px;
}

.education-link {
  color: #7b2f99;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.14em;
}

.education-link .q-icon {
  margin-left: 3px;
  font-size: 0.85em;
}

.student-arguments {
  padding: 44px 40px 48px;
  background: #edf7f2;
  color: #18352a;
}

.student-arguments__eyebrow {
  color: #257052;
}

.student-arguments>p,
.student-arguments__header,
.student-reasons,
.student-arguments__summary {
  max-width: 72ch;
}

.student-reasons {
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.student-reasons li {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(37, 112, 82, 0.18);
}

.student-reasons li>span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: #257052;
  color: #fff;
  font-weight: 700;
}

.student-reasons p {
  margin: 4px 0 0;
}

.student-arguments__summary {
  display: flex;
  gap: 14px;
  margin-top: 30px;
  padding: 20px;
  border-left: 4px solid #c62828;
  background: #fff;
  color: #3e2020;
}

.student-arguments__summary>.q-icon {
  flex: 0 0 auto;
  color: #c62828;
  font-size: 1.7rem;
}

.student-arguments__summary p {
  margin: 7px 0 0;
}

.education-page__footer {
  padding: 40px;
}

.education-note {
  max-width: 72ch;
  border: 1px solid #efcaca;
  background: #fff4f3;
  color: #552020;
  line-height: 1.65;
}

.education-sources {
  max-width: 72ch;
  margin-top: 34px;
}

.education-sources h2 {
  margin: 0 0 14px;
  font-size: 1.2rem;
}

.education-sources ul {
  margin: 0;
  padding-left: 20px;
}

.education-sources li {
  margin-bottom: 10px;
  line-height: 1.6;
}

.body--dark .education-page__lead,
.body--dark .lesson__eyebrow {
  color: #f2a7a7;
}

.body--dark .education-summary {
  background: rgba(107, 31, 31, 0.35);
  color: #f3d7d7;
}

.body--dark .education-summary--neutral {
  background: rgba(52, 64, 84, 0.45);
  color: #e0e5ec;
}

.body--dark .lesson {
  background: #191622;
}

.body--dark .lesson-step__number,
.body--dark .lesson-task {
  background: #26212f;
}

.body--dark .lesson-task {
  border-color: #463b52;
}

.body--dark .lesson-step__meta {
  color: #b9afc2;
}

.body--dark .student-arguments {
  background: #172923;
  color: #d8ebe3;
}

.body--dark .student-arguments__eyebrow {
  color: #84c9ae;
}

.body--dark .student-arguments__summary {
  background: #223830;
  color: #f2dddd;
}

.body--dark .education-note {
  border-color: rgba(242, 167, 167, 0.34);
  background: rgba(107, 31, 31, 0.35);
  color: #f3d7d7;
}

.body--dark .education-link {
  color: #d9a7ee;
}

@media (max-width: 600px) {

  .education-page__header,
  .education-page__content,
  .lesson,
  .student-arguments,
  .education-page__footer {
    padding-right: 22px;
    padding-left: 22px;
  }

  .education-page__header {
    padding-top: 28px;
  }

  .education-section__heading,
  .lesson__header,
  .student-arguments__header {
    align-items: flex-start;
  }

  .education-section__icon {
    flex-basis: 46px;
    width: 46px;
    height: 46px;
    font-size: 1.45rem;
  }

  .education-section__heading h2,
  .lesson__header h2,
  .student-arguments__header h2 {
    font-size: 1.25rem;
  }

  .lesson-step {
    grid-template-columns: 40px 1fr;
    gap: 14px;
  }

  .lesson-step__number {
    width: 40px;
    height: 40px;
  }

  .lesson-step:not(:last-child)::before {
    top: 38px;
    left: 19px;
  }

  .education-list li {
    grid-template-columns: 24px 1fr;
  }
}
</style>
