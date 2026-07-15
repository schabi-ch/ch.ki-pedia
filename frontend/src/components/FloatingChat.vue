<template>
  <div class="floating-chat" :class="{ 'floating-chat--expanded': isExpanded }">
    <q-card class="chat-card">
      <q-card-section class="chat-header q-py-sm row items-center no-wrap">
        <q-icon name="chat" class="q-mr-xs" />
        <span class="text-subtitle1 text-weight-medium col">{{ $t('chat.title') }}</span>

        <q-btn flat dense no-caps icon="delete_sweep" class="chat-clear-btn"
          :disable="!store.chatMessages.length && !store.chatLoading" @click="store.clearChatHistory()">
          <q-tooltip>{{ $t('chat.clearHistory') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense :icon="isExpanded ? 'fullscreen_exit' : 'fullscreen'" size="sm"
          :aria-label="$t(isExpanded ? 'chat.collapse' : 'chat.expand')" @click="isExpanded = !isExpanded"
          class="q-ml-sm">
          <q-tooltip>{{ $t(isExpanded ? 'chat.collapse' : 'chat.expand') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="close" size="sm" class="q-ml-lg" @click="$emit('close')" />
      </q-card-section>

      <q-separator />

      <q-card-section class="chat-messages" ref="chatContainer">
        <div v-if="!store.chatMessages.length" class="text-grey-5 text-center q-py-md">
          {{ $t('chat.placeholder') }}
        </div>
        <q-chat-message v-for="(msg, index) in store.chatMessages" :key="index"
          :name="msg.role === 'user' ? $t('chat.you') : $t('chat.assistant')" :sent="msg.role === 'user'"
          :bg-color="msg.role === 'user' ? 'primary' : 'grey-3'" :text-color="msg.role === 'user' ? 'white' : 'dark'">
          <div class="chat-message-content">
            <q-markdown :src="msg.content" class="chat-markdown" no-html no-heading-anchor-links />
            <div v-if="msg.role === 'assistant' && msg.citations?.length" class="chat-citations"
              :class="{ 'chat-citations--active': store.activeChatMessageId === msg.id }">
              <span class="chat-citations-label">{{ $t('chat.sources') }}</span>
              <q-btn v-for="(citationId, citationIndex) in msg.citations" :key="citationId" dense rounded no-caps
                size="sm" icon="article" :label="$t('chat.source', { number: citationIndex + 1 })"
                :outline="store.focusedCitationId !== citationId || store.activeChatMessageId !== msg.id"
                :unelevated="store.focusedCitationId === citationId && store.activeChatMessageId === msg.id"
                color="primary" :disable="msg.citationContextKey !== store.chatCitationContextKey"
                @click="store.activateChatCitations(msg.id, citationId)">
                <q-tooltip v-if="msg.citationContextKey !== store.chatCitationContextKey">
                  {{ $t('chat.sourceUnavailable') }}
                </q-tooltip>
              </q-btn>
            </div>
            <div v-if="msg.role === 'assistant' && msg.content.trim()" class="chat-message-actions">
              <q-btn flat round dense icon="content_copy" size="sm" :aria-label="$t('chat.copyAnswer')"
                @click="copyAnswerToClipboard(msg.content)">
                <q-tooltip>{{ $t('chat.copyAnswer') }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-chat-message>
        <div v-if="store.chatLoading" class="q-my-sm">
          <q-spinner-dots color="primary" size="sm" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-sm">
        <q-form @submit.prevent="onSendMessage" class="row items-center q-gutter-sm">
          <q-input v-model="chatInput" autofocus autogrow outlined dense :placeholder="$t('chat.placeholder')"
            class="chat-input col" :disable="store.chatLoading" @keydown.enter.exact.prevent="onSendMessage" />
          <q-btn v-if="!store.chatLoading" round color="primary" icon="send" type="submit"
            :disable="!chatInput.trim()" />
          <q-btn v-else round color="negative" icon="stop" :aria-label="$t('chat.stop')"
            @click="store.abortChatStream()" />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useWikipediaStore } from 'stores/wikipedia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import { copyTextToClipboard } from 'src/utils/article-export';

export default defineComponent({
  name: 'FloatingChat',

  components: {
    QMarkdown,
  },

  emits: ['close'],

  setup () {
    const store = useWikipediaStore();
    const quasar = useQuasar();
    const { t } = useI18n();

    watch(
      () => store.chatMessages,
      () => {
        void nextTick(() => {
          // Scroll handled via ref in mounted context
        });
      },
      { deep: true },
    );

    return { store, quasar, t };
  },

  data () {
    return {
      chatInput: '',
      isExpanded: true,
    };
  },

  watch: {
    'store.chatMessages': {
      deep: true,
      handler () {
        this.scrollChatToBottom();
      },
    },
  },

  mounted () {
    this.scrollChatToBottom();
  },

  methods: {
    scrollChatToBottom () {
      void nextTick(() => {
        const ref = this.$refs.chatContainer as { $el?: HTMLElement } | HTMLElement | undefined;
        const container = ref && '$el' in ref ? ref.$el : ref as HTMLElement | undefined;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },

    async onSendMessage () {
      const message = this.chatInput.trim();
      if (!message) return;
      this.chatInput = '';
      await this.store.sendMessage(message);
    },

    async copyAnswerToClipboard (content: string) {
      try {
        await copyTextToClipboard(content);
        this.quasar.notify({ type: 'positive', message: this.t('chat.copySuccess') });
      } catch (err) {
        console.error('Copy chat answer failed', err);
        this.quasar.notify({ type: 'negative', message: this.t('chat.copyError') });
      }
    },
  },
});
</script>

<style scoped>
.floating-chat {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 6000;
  width: 380px;
  max-width: calc(100vw - 48px);
}

.floating-chat--expanded {
  width: min(720px, calc(100vw - 48px));
}

.chat-card {
  display: flex;
  flex-direction: column;
  height: 500px;
  max-height: calc(100vh - 120px);
  border-radius: 20px;
  box-shadow: var(--kp-shadow-lg);
  border: 1px solid rgba(82, 40, 129, 0.08);
  overflow: hidden;
  background: var(--kp-surface);
}

.floating-chat--expanded .chat-card {
  height: min(720px, calc(100vh - 48px));
  max-height: calc(100vh - 48px);
}

.chat-header {
  background: var(--q-primary);
  color: white;
  border-radius: 0;
}

.chat-clear-btn {
  border-radius: 8px;
  flex: 0 1 auto;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  background: var(--kp-surface);
}

.chat-markdown :deep(*) {
  color: inherit;
}

.chat-markdown :deep(p) {
  margin: 0;
}

.chat-markdown :deep(p + p) {
  margin-top: 0.5rem;
}

.chat-markdown :deep(ul),
.chat-markdown :deep(ol) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}

.chat-markdown :deep(a) {
  color: inherit;
  text-decoration: underline;
}

.chat-message-content {
  display: block;
}

.chat-citations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(82, 40, 129, 0.12);
}

.chat-citations--active {
  border-top-color: var(--q-primary);
}

.chat-citations-label {
  color: var(--kp-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}

.chat-message-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 6px;
}

.chat-input :deep(textarea) {
  max-height: calc(1.5em * 4);
  overflow-y: auto;
}

@media (max-width: 520px) {
  .chat-clear-btn :deep(.q-btn__content)>.block {
    display: none;
  }
}
</style>
