<template>
    <q-dialog v-model="dialogOpen">
        <q-card class="quiz-dialog-card">
            <q-card-section class="quiz-dialog-header">
                <div>
                    <div class="quiz-dialog-title">{{ $t('article.quiz.title') }}</div>
                    <div v-if="sectionTitle" class="quiz-dialog-section">{{ sectionTitle }}</div>
                </div>
                <q-btn flat dense round icon="close" v-close-popup :aria-label="$t('article.close')" />
            </q-card-section>

            <q-separator />

            <q-card-section v-if="currentQuestion && !finished" class="quiz-dialog-body">
                <div class="quiz-progress">
                    {{ $t('article.quiz.progress', { current: currentIndex + 1, total: questions.length }) }}
                </div>
                <div class="quiz-question">{{ currentQuestion.question }}</div>

                <q-list class="quiz-answer-list">
                    <q-item v-for="(answer, index) in currentQuestion.answers" :key="`${currentIndex}:${index}`"
                        tag="label" class="quiz-answer" :class="answerClass(index)" clickable>
                        <q-item-section avatar>
                            <q-checkbox v-model="selectedAnswers" :val="index" :disable="checked" />
                        </q-item-section>
                        <q-item-section>{{ answer.text }}</q-item-section>
                    </q-item>
                </q-list>

                <div v-if="checked" class="quiz-feedback" :class="currentScore === 1 ? 'is-correct' : 'is-wrong'">
                    <div class="quiz-feedback-title">
                        {{ currentScore === 1 ? $t('article.quiz.correct') : $t('article.quiz.incorrect') }}
                    </div>
                    <div class="quiz-feedback-explanation">{{ currentQuestion.explanation }}</div>
                </div>
            </q-card-section>

            <q-card-section v-else class="quiz-result">
                <div class="quiz-result-title">{{ $t('article.quiz.resultTitle') }}</div>
                <div class="quiz-stars"
                    :aria-label="$t('article.quiz.stars', { score: totalScore, total: questions.length })">
                    <q-icon v-for="index in questions.length" :key="index"
                        :name="scoreFor(index - 1) ? 'star' : 'star_border'"
                        :color="scoreFor(index - 1) ? 'amber-7' : 'grey-5'" class="quiz-star" />
                </div>
                <div class="quiz-result-score">
                    {{ $t('article.quiz.stars', { score: totalScore, total: questions.length }) }}
                </div>
            </q-card-section>

            <q-card-actions align="right" class="quiz-dialog-actions">
                <q-btn flat no-caps :label="$t('article.close')" v-close-popup />
                <q-btn v-if="currentQuestion && !finished && !checked" color="primary" unelevated no-caps
                    :disable="selectedAnswers.length === 0" :label="$t('article.quiz.checkAnswer')"
                    @click="checkAnswer" />
                <q-btn v-else-if="currentQuestion && !finished" color="primary" unelevated no-caps
                    :label="isLastQuestion ? $t('article.quiz.showResult') : $t('article.quiz.nextQuestion')"
                    @click="goNext" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QuizQuestion } from 'stores/wikipedia';

const props = defineProps<{
    modelValue: boolean;
    questions: QuizQuestion[];
    sectionTitle?: string;
}>();

const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void;
}>();

const currentIndex = ref(0);
const selectedAnswers = ref<number[]>([]);
const checked = ref(false);
const scores = ref<number[]>([]);
const finished = ref(false);

const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
});

const currentQuestion = computed(() => props.questions[currentIndex.value]);
const isLastQuestion = computed(() => currentIndex.value >= props.questions.length - 1);
const currentScore = computed(() => scores.value[currentIndex.value] ?? 0);
const totalScore = computed(() => scores.value.reduce((sum, score) => sum + score, 0));

watch(
    () => props.modelValue,
    (isOpen) => {
        if (isOpen) resetQuiz();
    },
);

function resetQuiz () {
    currentIndex.value = 0;
    selectedAnswers.value = [];
    checked.value = false;
    scores.value = [];
    finished.value = false;
}

function checkAnswer () {
    const question = currentQuestion.value;
    if (!question) return;
    const selected = [...selectedAnswers.value].sort((a, b) => a - b);
    const correct = question.answers
        .map((answer, index) => (answer.correct ? index : -1))
        .filter((index) => index >= 0);
    const isCorrect = selected.length === correct.length && selected.every((value, index) => value === correct[index]);
    scores.value[currentIndex.value] = isCorrect ? 1 : 0;
    checked.value = true;
}

function goNext () {
    if (isLastQuestion.value) {
        finished.value = true;
        return;
    }
    currentIndex.value += 1;
    selectedAnswers.value = [];
    checked.value = false;
}

function answerClass (index: number): Record<string, boolean> {
    const question = currentQuestion.value;
    if (!checked.value || !question) return {};
    const answer = question.answers[index];
    return {
        'is-correct-answer': answer?.correct === true,
        'is-wrong-answer': selectedAnswers.value.includes(index) && answer?.correct !== true,
    };
}

function scoreFor (index: number): number {
    return scores.value[index] ?? 0;
}
</script>

<style lang="scss" scoped>
.quiz-dialog-card {
    width: min(620px, calc(100vw - 32px));
    border-radius: 16px;
}

.quiz-dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.quiz-dialog-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--kp-text-primary);
}

.quiz-dialog-section,
.quiz-progress {
    color: var(--kp-text-secondary);
    font-size: 0.9rem;
}

.quiz-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.quiz-question {
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.35;
    color: var(--kp-text-primary);
}

.quiz-answer-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.quiz-answer {
    border: 1px solid rgba(82, 40, 129, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
}

.quiz-answer.is-correct-answer {
    border-color: rgba(36, 132, 72, 0.45);
    background: rgba(36, 132, 72, 0.1);
}

.quiz-answer.is-wrong-answer {
    border-color: rgba(190, 47, 47, 0.45);
    background: rgba(190, 47, 47, 0.08);
}

.quiz-feedback {
    border-radius: 8px;
    padding: 12px 14px;
    line-height: 1.45;
}

.quiz-feedback.is-correct {
    background: rgba(36, 132, 72, 0.1);
}

.quiz-feedback.is-wrong {
    background: rgba(190, 47, 47, 0.08);
}

.quiz-feedback-title {
    font-weight: 700;
    margin-bottom: 4px;
}

.quiz-result {
    text-align: center;
    padding: 32px 24px;
}

.quiz-result-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 18px;
}

.quiz-stars {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
}

.quiz-star {
    font-size: 48px;
    animation: star-pop 0.38s ease both;
}

.quiz-star:nth-child(2) {
    animation-delay: 0.08s;
}

.quiz-star:nth-child(3) {
    animation-delay: 0.16s;
}

.quiz-result-score {
    color: var(--kp-text-secondary);
    font-weight: 600;
}

.quiz-dialog-actions {
    padding: 8px 16px 16px;
}

@keyframes star-pop {
    from {
        opacity: 0;
        transform: scale(0.72);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
