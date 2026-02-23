<template>
  <q-page class="q-pa-md">
    <div v-if="store.articleLoading" class="row justify-center q-mt-xl">
      <div class="text-center">
        <q-spinner color="primary" size="3em" />
        <div class="q-mt-sm text-grey-6">{{ $t('article.loading') }}</div>
      </div>
    </div>

    <q-banner v-else-if="store.articleError" class="bg-negative text-white">
      {{ store.articleError }}
    </q-banner>

    <div v-else-if="store.article">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h5 text-primary">{{ store.article.title }}</div>
          <a
            :href="store.article.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-caption text-grey-6"
          >
            {{ $t('article.sourceLink') }}
            <q-icon name="open_in_new" size="xs" />
          </a>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-select
            v-model="store.cefrLevel"
            :options="cefrOptions"
            emit-value
            map-options
            dense
            outlined
            :label="$t('article.cefrLabel')"
            style="min-width: 200px"
            @update:model-value="onLevelChange"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-7">
          <q-card flat bordered>
            <q-card-section>
              <div v-if="store.simplifyLoading" class="text-center q-py-lg">
                <q-spinner color="primary" />
                <div class="text-grey-6 q-mt-sm">{{ $t('article.simplifying') }}</div>
              </div>
              <div
                v-else
                class="article-content text-body1"
                style="white-space: pre-wrap"
              >
                {{ store.simplifiedContent || store.article.content }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-5">
          <q-card flat bordered class="chat-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-medium">
                <q-icon name="chat" class="q-mr-xs" />
                {{ $t('chat.title') }}
              </div>
            </q-card-section>

            <q-card-section class="chat-messages" ref="chatContainer">
              <div v-if="!store.chatMessages.length" class="text-grey-5 text-center q-py-md">
                {{ $t('chat.placeholder') }}
              </div>
              <q-chat-message
                v-for="(msg, index) in store.chatMessages"
                :key="index"
                :text="[msg.content]"
                :name="msg.role === 'user' ? $t('chat.you') : $t('chat.assistant')"
                :sent="msg.role === 'user'"
                :bg-color="msg.role === 'user' ? 'primary' : 'grey-3'"
                :text-color="msg.role === 'user' ? 'white' : 'dark'"
              />
              <div v-if="store.chatLoading" class="row justify-start q-mt-sm">
                <q-spinner color="primary" size="sm" />
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pt-sm">
              <q-form @submit.prevent="onSendMessage" class="row items-center q-gutter-sm">
                <q-input
                  v-model="chatInput"
                  outlined
                  dense
                  :placeholder="$t('chat.placeholder')"
                  class="col"
                  :disable="store.chatLoading"
                />
                <q-btn
                  round
                  color="primary"
                  icon="send"
                  type="submit"
                  :loading="store.chatLoading"
                  :disable="!chatInput.trim()"
                />
              </q-form>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { useWikipediaStore } from 'stores/wikipedia';

export default defineComponent({
  name: 'ArticlePage',

  setup() {
    const store = useWikipediaStore();
    return { store };
  },

  data() {
    return {
      chatInput: '',
      cefrOptions: [
        { label: 'A1 – Beginner', value: 'A1' },
        { label: 'A2 – Elementary', value: 'A2' },
        { label: 'B1 – Intermediate', value: 'B1' },
        { label: 'B2 – Upper intermediate', value: 'B2' },
      ],
    };
  },

  watch: {
    '$route.params.title': {
      immediate: true,
      handler(title: string) {
        if (title) {
          void this.store.loadArticle(decodeURIComponent(title));
        }
      },
    },
    'store.chatMessages': {
      deep: true,
      handler() {
        void nextTick(() => {
          const container = this.$refs.chatContainer as HTMLElement | undefined;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      },
    },
  },

  methods: {
    onLevelChange() {
      void this.store.simplify();
    },

    async onSendMessage() {
      const message = this.chatInput.trim();
      if (!message) return;
      this.chatInput = '';
      await this.store.sendMessage(message);
    },
  },
});
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.article-content {
  line-height: 1.7;
}
</style>
