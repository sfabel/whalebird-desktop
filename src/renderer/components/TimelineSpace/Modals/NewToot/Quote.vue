<template>
  <div class="quote-target">
    <div class="icon">
      <FailoverImg :src="message.account.avatar" />
    </div>
    <div class="detail">
      <div class="toot-header">
        <div class="user">
          <span class="display-name"><bdi v-html="username(message.account)"></bdi></span>
          <span class="acct">{{ accountName(message.account) }}</span>
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="content-wrapper">
        <div class="spoiler" v-html="emojiText(message.spoiler_text, message.emojis)"></div>
        <div class="content" v-html="emojiText(message.content, message.emojis)"></div>
      </div>
    </div>
    <div class="clearfix"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue'
import DisplayStyle from '~/src/constants/displayStyle'
import FailoverImg from '@/components/atoms/FailoverImg.vue'
import emojify from '@/utils/emojify'
import { Entity } from 'megalodon'

export default defineComponent({
  new: 'quote-target',
  components: {
    FailoverImg
  },
  props: {
    message: {
      type: Object,
      default: {}
    },
    displayNameStyle: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const { displayNameStyle } = toRefs(props)
    const username = (account: Entity.Account) => {
      switch (displayNameStyle.value) {
        case DisplayStyle.DisplayNameAndUsername.value:
          if (account.display_name !== '') {
            return emojify(account.display_name, account.emojis)
          } else {
            return account.acct
          }
        case DisplayStyle.DisplayName.value:
          if (account.display_name !== '') {
            return emojify(account.display_name, account.emojis)
          } else {
            return account.acct
          }
        default:
          return account.acct
      }
    }
    const accountName = (account: Entity.Account) => {
      switch (displayNameStyle.value) {
        case DisplayStyle.DisplayNameAndUsername.value:
          return `@${account.acct}`
        case DisplayStyle.DisplayName.value:
        default:
          return ''
      }
    }
    const emojiText = (content: string, emojis: Array<Entity.Emoji>) => {
      return emojify(content, emojis)
    }

    return {
      username,
      accountName,
      emojiText
    }
  }
})
</script>

<style lang="scss" scoped>
.quote-target {
  background-color: var(--theme-background-color);
  padding: 8px 12px;

  .icon {
    float: left;

    img {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: block;
    }
  }

  .detail {
    margin: 0 8px 0 8px;
    float: left;
    width: calc(100% - 52px);

    .content-wrapper {
      font-size: var(--base-font-size);
      color: var(--theme-primary-color);

      blockquote {
        padding-left: 10px;
        border-left: 3px solid #9baec8;
        color: #9baec8;
        margin: 0;
      }

      .content {
        margin: var(--toot-padding) 0;
        word-wrap: break-word;

        pre {
          white-space: pre-wrap;
        }
      }

      .content p {
        unicode-bidi: plaintext;
      }
    }

    .content-wrapper :deep(.emojione) {
      width: 20px;
      height: 20px;
    }

    .toot-header {
      .user {
        float: left;
        font-size: var(--base-font-size);
        white-space: nowrap;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;

        .display-name {
          font-weight: 800;
          color: var(--theme-primary-color);
        }

        .display-name :deep(.emojione) {
          max-width: 14px;
          max-height: 14px;
        }

        .acct {
          font-weight: normal;
          color: var(--theme-secondary-color);
        }
      }
    }

    .spoiler {
      margin: 8px 0;

      &:empty {
        display: none;
      }
    }
  }
}
</style>
