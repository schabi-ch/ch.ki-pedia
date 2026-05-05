<template>
  <div class="floating-chat">
    <q-card class="chat-card">
      <q-card-section class="chat-header q-py-sm row items-center no-wrap">
        <q-icon name="chat" class="q-mr-xs" />
        <span class="text-subtitle1 text-weight-medium col">{{ $t('chat.title') }}</span>
        <q-btn flat round dense icon="close" size="sm" @click="$emit('close')" />
      </q-card-section>

      <q-separator />

      <q-card-section class="chat-messages" ref="chatContainer">
        <div v-if="!store.chatMessages.length" class="text-grey-5 text-center q-py-md">
          {{ $t('chat.placeholder') }}
        </div>
        <q-chat-message v-for="(msg, index) in store.chatMessages" :key="index"
          :name="msg.role === 'user' ? $t('chat.you') : $t('chat.assistant')" :sent="msg.role === 'user'"
          :bg-color="msg.role === 'user' ? 'primary' : 'grey-3'" :text-color="msg.role === 'user' ? 'white' : 'dark'">
          <q-markdown :src="msg.content" class="chat-markdown" no-html no-heading-anchor-links />
        </q-chat-message>
        <div v-if="store.chatLoading" class="row justify-start q-mt-sm">
          <q-spinner color="primary" size="sm" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-sm">
        <q-form @submit.prevent="onSendMessage" class="row items-center q-gutter-sm">
          <q-input v-model="chatInput" autofocus autogrow outlined dense :placeholder="$t('chat.placeholder')"
            class="col" :disable="store.chatLoading" @keydown.enter.exact.prevent="onSendMessage" />
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
import { useWikipediaStore } from 'stores/wikipedia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';

export default defineComponent({
  name: 'FloatingChat',

  components: {
    QMarkdown,
  },

  emits: ['close'],

  setup () {
    const store = useWikipediaStore();

    watch(
      () => store.chatMessages,
      () => {
        void nextTick(() => {
          // Scroll handled via ref in mounted context
        });
      },
      { deep: true },
    );

    return { store };
  },

  data () {
    return {
      chatInput: '',
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

.chat-header {
  background: var(--q-primary);
  color: white;
  border-radius: 0;
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
</style>
