<template>
  <div ref="statusRef" class="status" tabIndex="0" role="article" aria-label="toot" @click="$emit('selectToot', message)">
    <div v-if="filtered" class="filtered">Filtered</div>
    <div v-if="!filtered" class="toot">
      <div class="reblogger" v-if="message.reblog && !message.quote">
        <span class="reblogger-icon" @click="openUser(message.account)" role="presentation">
          <FailoverImg :src="message.account.avatar" :alt="`Avatar of ${message.account.username}`" />
        </span>
        <font-awesome-icon icon="retweet" />
        <span
          class="reblogger-name"
          @click="openUser(message.account)"
          :title="`Reblogged by ${message.account.username}`"
          :aria-label="`Reblogged by ${message.account.username}`"
        >
          <bdi v-html="username(message.account)"></bdi>
        </span>
      </div>
      <div class="icon" role="presentation">
        <FailoverImg
          :src="originalMessage.account.avatar"
          @click="openUser(originalMessage.account)"
          :alt="`Avatar of ${originalMessage.account.username}`"
        />
      </div>
      <div class="detail" v-on:dblclick="openDetail(message)">
        <div class="toot-header">
          <div class="user" @click="openUser(originalMessage.account)">
            <span class="display-name"><bdi v-html="username(originalMessage.account)"></bdi></span>
            <span class="acct">{{ accountName(originalMessage.account) }}</span>
          </div>
          <div class="timestamp">
            <time :datetime="originalMessage.created_at" :title="readableTimestamp" @click="openDetail(message)">
              {{ timestamp }}
            </time>
          </div>
          <div class="clearfix"></div>
        </div>
        <div class="content-wrapper">
          <div class="spoiler" v-if="spoilered">
            <span v-html="emojiText(originalMessage.spoiler_text, originalMessage.emojis)"></span>
            <el-button v-if="!isShowContent" plain type="primary" size="default" class="spoil-button" @click="toggleSpoiler">
              {{ $t('cards.toot.show_more') }}
            </el-button>
            <el-button v-else type="primary" size="default" class="spoil-button" @click="toggleSpoiler">
              {{ $t('cards.toot.hide') }}
            </el-button>
          </div>
          <div
            class="content"
            v-if="isShowContent"
            v-html="emojiText(originalMessage.content, originalMessage.emojis)"
            @click.capture.prevent="tootClick"
          ></div>
          <Poll v-if="isShowContent && poll" :poll="poll" @vote="vote" @refresh="refresh"></Poll>
        </div>
        <div class="attachments">
          <el-button v-if="sensitive && !isShowAttachments" class="show-sensitive" type="info" @click="toggleCW()">
            {{ $t('cards.toot.sensitive') }}
          </el-button>
          <div v-if="isShowAttachments">
            <el-button v-if="sensitive && isShowAttachments" class="hide-sensitive" link :title="$t('cards.toot.hide')" @click="toggleCW()">
              <font-awesome-icon icon="eye" class="hide" />
            </el-button>
            <div class="media" v-bind:key="media.preview_url" v-for="media in mediaAttachments">
              <FailoverImg
                :src="media.preview_url ? media.preview_url : originalMessage.account.avatar"
                @click="openImage(media.url, mediaAttachments)"
                :title="media.description"
                :readExif="true"
              />
              <el-tag class="media-label" size="small" v-if="media.type === 'gifv'">GIF</el-tag>
              <el-tag class="media-label" size="small" v-else-if="media.type === 'video'">VIDEO</el-tag>
              <el-tag class="media-label" size="small" v-else-if="media.type === 'audio'">AUDIO</el-tag>
            </div>
          </div>
          <div class="clearfix"></div>
        </div>
        <Quote
          v-if="message.quote"
          :icon="message.reblog.account.avatar"
          :username="username(message.reblog.account)"
          :accountName="accountName(message.reblog.account)"
          :body="emojiText(message.reblog.content, message.reblog.emojis)"
          @select="openDetail(message.reblog)"
        />
        <LinkPreview
          v-if="originalMessage.card && originalMessage.card.type === 'link'"
          :icon="originalMessage.card.image"
          :title="originalMessage.card.title"
          :description="originalMessage.card.description"
          :url="originalMessage.card.url"
        />
        <div class="emoji-reactions">
          <template v-for="reaction in originalMessage.emoji_reactions" :key="reaction.name">
            <el-button v-if="reaction.me" type="success" size="default" class="reaction" @click="removeReaction(reaction.name)"
              >{{ reaction.name }} {{ reaction.count }}</el-button
            >
            <el-button v-else link size="default" class="reaction" @click="addReaction(reaction.name)"
              >{{ reaction.name }} {{ reaction.count }}</el-button
            >
          </template>
        </div>
        <div class="toot-footer">
          <div class="tool-box">
            <el-button link class="reply" :title="$t('cards.toot.reply')" :aria-label="$t('cards.toot.reply')" @click="openReply()">
              <font-awesome-icon icon="reply" size="sm" />
            </el-button>
            <el-button v-if="locked" link class="locked">
              <font-awesome-icon icon="lock" size="sm" />
            </el-button>
            <el-button v-else-if="directed" link class="directed">
              <font-awesome-icon icon="envelope" size="sm" />
            </el-button>
            <el-button
              v-else
              link
              @click="changeReblog(originalMessage)"
              :class="originalMessage.reblogged ? 'reblogged' : 'reblog'"
              :title="$t('cards.toot.reblog')"
            >
              <font-awesome-icon icon="retweet" size="sm" />
            </el-button>
            <div class="count" v-if="reblogsCount">
              {{ reblogsCount }}
            </div>
            <el-button
              link
              @click="changeFavourite(originalMessage)"
              :class="originalMessage.favourited ? 'favourited animated bounceIn' : 'favourite'"
              :title="$t('cards.toot.fav')"
              :aria-label="$t('cards.toot.fav')"
            >
              <font-awesome-icon icon="star" size="sm" />
            </el-button>
            <div class="count" v-if="favouritesCount">
              {{ favouritesCount }}
            </div>
            <el-button
              v-if="bookmarkSupported"
              :class="originalMessage.bookmarked ? 'bookmarked' : 'bookmark'"
              link
              :title="$t('cards.toot.bookmark')"
              :aria-label="$t('cards.toot.bookmark')"
              @click="changeBookmark(originalMessage)"
            >
              <font-awesome-icon icon="bookmark" size="sm" />
            </el-button>
            <el-button v-if="quoteSupported" link class="quote-btn" @click="openQuote()">
              <font-awesome-icon icon="quote-right" size="sm" />
            </el-button>
            <template v-if="sns !== 'mastodon'">
              <el-popover
                placement="bottom"
                width="281"
                trigger="click"
                popper-class="status-emoji-picker"
                ref="status_emoji_picker"
                @show="emojiPickerShow"
                @hide="emojiPickerHide"
                :persistent="false"
              >
                <picker
                  v-if="emojiPickerOpened"
                  :data="emojiIndex"
                  set="twitter"
                  :autoFocus="true"
                  @select="selectEmoji"
                  :perLine="7"
                  :emojiSize="24"
                  :showPreview="false"
                  :emojiTooltip="true"
                />
                <template #reference>
                  <el-button class="emoji" link>
                    <font-awesome-icon :icon="['far', 'face-smile']" size="sm" />
                  </el-button>
                </template>
              </el-popover>
            </template>
            <el-button v-if="pinned" class="pinned" link :title="$t('cards.toot.pinned')" :aria-label="$t('cards.toot.pinned')">
              <font-awesome-icon icon="thumbtack" size="sm" />
            </el-button>
            <el-popover
              placement="bottom"
              width="200"
              trigger="click"
              popper-class="status-menu-popper"
              ref="status_menu_popper"
              :persistent="false"
            >
              <ul class="menu-list">
                <li role="button" @click="openDetail(message)" v-if="!detailed">
                  {{ $t('cards.toot.view_toot_detail') }}
                </li>
                <li role="button" @click="openBrowser(originalMessage)">
                  {{ $t('cards.toot.open_in_browser') }}
                </li>
                <li role="button" @click="copyLink(originalMessage)">
                  {{ $t('cards.toot.copy_link_to_toot') }}
                </li>
                <li role="button" class="separate" @click="confirmMute()">
                  {{ $t('cards.toot.mute') }}
                </li>
                <li role="button" @click="block()">
                  {{ $t('cards.toot.block') }}
                </li>
                <li role="button" @click="reportUser()" v-if="!isMyMessage">
                  {{ $t('cards.toot.report') }}
                </li>
                <li role="button" class="separate" @click="deleteToot(message)" v-if="isMyMessage">
                  {{ $t('cards.toot.delete') }}
                </li>
              </ul>
              <template #reference>
                <el-button link :title="$t('cards.toot.detail')">
                  <font-awesome-icon icon="ellipsis" size="sm" />
                </el-button>
              </template>
            </el-popover>
          </div>
          <div class="application" v-if="application !== null">
            {{ $t('cards.toot.via', { application: application }) }}
          </div>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
    <div class="fill-line"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, toRefs, watch, nextTick } from 'vue'
import { useMagicKeys, whenever, and } from '@vueuse/core'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
import data from 'emoji-mart-vue-fast/data/all.json'
import moment from 'moment'
import { Entity } from 'megalodon'
import { useRoute, useRouter } from 'vue-router'
import { useI18next } from 'vue3-i18next'
import { ElMessage } from 'element-plus'
import { useStore } from '@/store'
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'
import { findAccount, findLink, findTag } from '~/src/renderer/utils/tootParser'
import emojify from '~/src/renderer/utils/emojify'
import FailoverImg from '~/src/renderer/components/atoms/FailoverImg.vue'
import Poll from '~/src/renderer/components/molecules/Toot/Poll.vue'
import LinkPreview from '~/src/renderer/components/molecules/Toot/LinkPreview.vue'
import Quote from '@/components/molecules/Toot/Quote.vue'
// import { setInterval, clearInterval } from 'timers'
import QuoteSupported from '@/utils/quoteSupported'
import Filtered from '@/utils/filter'
import { usernameWithStyle, accountNameWithStyle } from '@/utils/username'
import { parseDatetime } from '@/utils/datetime'
import { MUTATION_TYPES as SIDEBAR_MUTATION, ACTION_TYPES as SIDEBAR_ACTION } from '@/store/TimelineSpace/Contents/SideBar'
import { ACTION_TYPES as PROFILE_ACTION } from '@/store/TimelineSpace/Contents/SideBar/AccountProfile'
import { ACTION_TYPES as NEW_ACTION } from '@/store/TimelineSpace/Modals/NewToot'
import { ACTION_TYPES as DETAIL_ACTION } from '@/store/TimelineSpace/Contents/SideBar/TootDetail'
import { ACTION_TYPES as REPORT_ACTION } from '@/store/TimelineSpace/Modals/Report'
import { ACTION_TYPES as MUTE_ACTION } from '@/store/TimelineSpace/Modals/MuteConfirm'
import { ACTION_TYPES as VIEWER_ACTION } from '@/store/TimelineSpace/Modals/ImageViewer'
import { ACTION_TYPES } from '@/store/organisms/Toot'

const defaultEmojiIndex = new EmojiIndex(data)

export default defineComponent({
  name: 'toot',
  components: {
    FailoverImg,
    Poll,
    Picker,
    LinkPreview,
    Quote
  },
  props: {
    message: {
      type: Object as PropType<Entity.Status>,
      default: {}
    },
    filters: {
      type: Array as PropType<Array<Entity.Filter>>,
      default: []
    },
    focused: {
      type: Boolean,
      default: false
    },
    overlaid: {
      type: Boolean,
      default: false
    },
    pinned: {
      type: Boolean,
      default: false
    },
    detailed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['selectToot', 'focusRight', 'focusLeft'],
  setup(props, ctx) {
    const space = 'organisms/Toot'
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const i18n = useI18next()
    const { focused, overlaid, message, filters } = toRefs(props)
    const { l, h, r, b, f, o, p, i, x } = useMagicKeys()

    const statusRef = ref<any>(null)
    const showContent = ref(store.state.App.ignoreCW)
    const showAttachments = ref(store.state.App.ignoreNSFW)
    const hideAllAttachments = ref(store.state.App.hideAllAttachments)
    const emojiPickerOpened = ref(false)
    const emojiIndex = defaultEmojiIndex

    const displayNameStyle = computed(() => store.state.App.displayNameStyle)
    const timeFormat = computed(() => store.state.App.timeFormat)
    const language = computed(() => store.state.App.language)
    const sns = computed(() => store.state.TimelineSpace.sns)
    const account = computed(() => store.state.TimelineSpace.account)
    const bookmarkSupported = computed(() => store.state.TimelineSpace.SideMenu.enabledTimelines.bookmark)
    const shortcutEnabled = computed(() => focused.value && !overlaid.value)
    const originalMessage = computed(() => {
      if (message.value.reblog && !message.value.quote) {
        return message.value.reblog
      } else {
        return message.value
      }
    })
    const timestamp = computed(() => parseDatetime(originalMessage.value.created_at, timeFormat.value, language.value))
    const readableTimestamp = computed(() => {
      moment.locale(language.value)
      return moment(originalMessage.value.created_at).format('LLLL')
    })
    const mediaAttachments = computed(() => {
      return originalMessage.value.media_attachments
    })
    const reblogsCount = computed(() => {
      if (originalMessage.value.reblogs_count > 0) {
        return originalMessage.value.reblogs_count
      }
      return null
    })
    const favouritesCount = computed(() => {
      if (originalMessage.value.favourites_count > 0) {
        return originalMessage.value.favourites_count
      }
      return null
    })
    const isMyMessage = computed(() => {
      return store.state.TimelineSpace.account.accountId === originalMessage.value.account.id
    })
    const application = computed(() => {
      const msg = originalMessage.value
      if (msg.application !== undefined && msg.application !== null) {
        return msg.application.name
      }
      return null
    })
    const spoilered = computed(() => {
      return originalMessage.value.spoiler_text.length > 0
    })
    const isShowContent = computed(() => {
      return !spoilered.value || showContent.value
    })
    const poll = computed(() => {
      return originalMessage.value.poll
    })
    const sensitive = computed(() => {
      return (hideAllAttachments.value || originalMessage.value.sensitive) && mediaAttachments.value.length > 0
    })
    const isShowAttachments = computed(() => {
      return !sensitive.value || showAttachments.value
    })
    const filtered = computed(() => {
      return Filtered(originalMessage.value.content, filters.value)
    })
    const locked = computed(() => {
      return originalMessage.value.visibility === 'private'
    })
    const directed = computed(() => {
      return originalMessage.value.visibility === 'direct'
    })
    const quoteSupported = computed(() => {
      return QuoteSupported(sns.value, account.value.domain)
    })

    whenever(and(l, shortcutEnabled), () => {
      ctx.emit('focusRight')
    })
    whenever(and(h, shortcutEnabled), () => {
      ctx.emit('focusLeft')
    })
    whenever(and(r, shortcutEnabled), () => {
      openReply()
    })
    whenever(and(b, shortcutEnabled), () => {
      changeReblog(originalMessage.value)
    })
    whenever(and(f, shortcutEnabled), () => {
      changeFavourite(originalMessage.value)
    })
    whenever(and(o, shortcutEnabled), () => {
      openDetail(message.value)
    })
    whenever(and(p, shortcutEnabled), () => {
      openUser(originalMessage.value.account)
    })
    whenever(and(i, shortcutEnabled), () => {
      const images = mediaAttachments.value
      if (images.length === 0) {
        return
      }
      openImage(images[0].url, images)
    })
    whenever(and(x, shortcutEnabled), () => {
      toggleSpoiler()
      toggleCW()
    })

    watch(focused, (newVal, oldVal) => {
      if (newVal) {
        nextTick(() => {
          statusRef.value.focus()
        })
      } else if (oldVal && !newVal) {
        nextTick(() => {
          statusRef.value.blur()
        })
      }
    })

    const username = (account: Entity.Account) => usernameWithStyle(account, displayNameStyle.value)
    const accountName = (account: Entity.Account) => accountNameWithStyle(account, displayNameStyle.value)
    const tootClick = (e: MouseEvent) => {
      const parsedTag = findTag(e.target as HTMLElement, 'toot')
      if (parsedTag !== null) {
        const tag = `/${route.params.id}/hashtag/${parsedTag}`
        router.push({ path: tag })
        return tag
      }
      const parsedAccount = findAccount(e.target as HTMLElement, 'toot')
      if (parsedAccount !== null) {
        store.commit(`TimelineSpace/Contents/SideBar/${SIDEBAR_MUTATION.CHANGE_OPEN_SIDEBAR}`, true)
        store
          .dispatch(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_ACTION.SEARCH_ACCOUNT}`, {
            parsedAccount: parsedAccount,
            status: originalMessage.value
          })
          .then(account => {
            store.dispatch(`TimelineSpace/Contents/SideBar/${SIDEBAR_ACTION.OPEN_ACCOUNT_COMPONENT}`)
            store.dispatch(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_ACTION.CHANGE_ACCOUNT}`, account)
          })
          .catch(err => {
            console.error(err)
            openLink(e)
            store.commit(`TimelineSpace/Contents/SideBar/${SIDEBAR_MUTATION.CHANGE_OPEN_SIDEBAR}`, false)
          })
        return parsedAccount.acct
      }
      return openLink(e)
    }
    const openLink = (e: MouseEvent) => {
      const link = findLink(e.target as HTMLElement, 'toot')
      if (link !== null) {
        return (window as any).shell.openExternal(link)
      }
    }
    const openReply = () => {
      store.dispatch(`TimelineSpace/Modals/NewToot/${NEW_ACTION.OPEN_REPLY}`, originalMessage.value)
    }
    const openDetail = (message: Entity.Status) => {
      store.dispatch(`TimelineSpace/Contents/SideBar/${SIDEBAR_ACTION.OPEN_TOOT_COMPONENT}`)
      store.dispatch(`TimelineSpace/Contents/SideBar/TootDetail/${DETAIL_ACTION.CHANGE_TOOT}`, message)
      store.commit(`TimelineSpace/Contents/SideBar/${SIDEBAR_MUTATION.CHANGE_OPEN_SIDEBAR}`, true)
    }
    const openBrowser = (message: Entity.Status) => {
      ;(window as any).shell.openExternal(message.url)
    }
    const copyLink = (message: Entity.Status) => {
      ;(window as any).clipboard.writeText(message.url, 'toot-link')
    }
    const reportUser = () => {
      store.dispatch(`TimelineSpace/Modals/Report/${REPORT_ACTION.OPEN_REPORT}`, originalMessage.value)
    }
    const confirmMute = () => {
      store.dispatch(`TimelineSpace/Modals/MuteConfirm/${MUTE_ACTION.CHANGE_ACCOUNT}`, originalMessage.value.account)
      store.dispatch(`TimelineSpace/Modals/MuteConfirm/${MUTE_ACTION.CHANGE_MODAL}`, true)
    }
    const block = () => {
      store.dispatch(`${space}/${ACTION_TYPES.BLOCK}`, originalMessage.value.account)
    }
    const changeReblog = (message: Entity.Status) => {
      if (message.reblogged) {
        store
          .dispatch(`${space}/${ACTION_TYPES.UNREBLOG}`, message)
          .then(data => {
            ctx.emit('update', data)
          })
          .catch(err => {
            console.error(err)
            ElMessage({
              message: i18n.t('message.unreblog_error'),
              type: 'error'
            })
          })
      } else {
        store
          .dispatch(`${space}/${ACTION_TYPES.REBLOG}`, message)
          .then(data => {
            ctx.emit('update', data)
          })
          .catch(err => {
            console.error(err)
            ElMessage({
              message: i18n.t('message.reblog_error'),
              type: 'error'
            })
          })
      }
    }
    const changeFavourite = (message: Entity.Status) => {
      if (message.favourited) {
        store
          .dispatch(`${space}/${ACTION_TYPES.REMOVE_FAVOURITE}`, message)
          .then(data => {
            ctx.emit('update', data)
          })
          .catch(err => {
            console.error(err)
            ElMessage({
              message: i18n.t('message.unfavourite_error'),
              type: 'error'
            })
          })
      } else {
        store
          .dispatch(`${space}/${ACTION_TYPES.ADD_FAVOURITE}`, message)
          .then(data => {
            ctx.emit('update', data)
          })
          .catch(err => {
            console.error(err)
            ElMessage({
              message: i18n.t('message.favourite_error'),
              type: 'error'
            })
          })
      }
    }
    const changeBookmark = (message: Entity.Status) => {
      if (message.bookmarked) {
        store
          .dispatch(`${space}/${ACTION_TYPES.REMOVE_BOOKMARK}`, message)
          .then(data => {
            ctx.emit('update', data)
          })
          .catch(err => {
            console.error(err)
            ElMessage({
              message: i18n.t('message.unbookmark_error'),
              type: 'error'
            })
          })
      } else {
        store
          .dispatch(`${space}/${ACTION_TYPES.ADD_BOOKMARK}`, message)
          .then(data => {
            ctx.emit('update', data)
          })
          .catch(err => {
            console.error(err)
            ElMessage({
              message: i18n.t('message.bookmark_error'),
              type: 'error'
            })
          })
      }
    }
    const openImage = (url: string, rawMediaList: Array<Entity.Attachment>) => {
      const mediaList = rawMediaList.map(media => {
        return media.url
      })
      const currentIndex = mediaList.indexOf(url)
      store.dispatch(`TimelineSpace/Modals/ImageViewer/${VIEWER_ACTION.OPEN_MODAL}`, {
        currentIndex: currentIndex,
        mediaList: rawMediaList
      })
    }
    const openUser = (account: Entity.Account) => {
      store.dispatch(`TimelineSpace/Contents/SideBar/${SIDEBAR_ACTION.OPEN_ACCOUNT_COMPONENT}`)
      store.dispatch(`TimelineSpace/Contents/SideBar/AccountProfile/${PROFILE_ACTION.CHANGE_ACCOUNT}`, account)
      store.commit(`TimelineSpace/Contents/SideBar/${SIDEBAR_MUTATION.CHANGE_OPEN_SIDEBAR}`, true)
    }
    const deleteToot = (message: Entity.Status) => {
      store
        .dispatch(`${space}/${ACTION_TYPES.DELETE_TOOT}`, message)
        .then(message => {
          ctx.emit('delete', message)
        })
        .catch(() => {
          ElMessage({
            message: i18n.t('message.delete_error'),
            type: 'error'
          })
        })
    }
    const emojiText = (content: string, emojis: Array<Entity.Emoji>) => {
      return emojify(content, emojis)
    }
    const vote = async choices => {
      if (!poll.value) {
        return
      }
      const res = await store.dispatch(`${space}/${ACTION_TYPES.VOTE}`, {
        id: poll.value.id,
        choices: choices
      })
      const status = Object.assign({}, originalMessage.value, {
        poll: res
      })
      ctx.emit('update', status)
    }
    const refresh = async (id: string) => {
      const res = await store.dispatch(`${space}/${ACTION_TYPES.REFRESH}`, id)
      const status = Object.assign({}, originalMessage.value, {
        poll: res
      })
      ctx.emit('update', status)
    }
    const selectEmoji = async (emoji: any) => {
      const status = await store.dispatch(`${space}/${ACTION_TYPES.SEND_REACTION}`, {
        status_id: originalMessage.value.id,
        native: emoji.native
      })
      ctx.emit('update', status)
    }
    const addReaction = async (native: any) => {
      const status = await store.dispatch(`${space}/${ACTION_TYPES.SEND_REACTION}`, {
        status_id: originalMessage.value.id,
        native: native
      })
      ctx.emit('update', status)
    }
    const removeReaction = async (native: any) => {
      const status = await store.dispatch(`${space}/${ACTION_TYPES.DELETE_REACTION}`, {
        status_id: originalMessage.value.id,
        native: native
      })
      ctx.emit('update', status)
    }
    const openQuote = () => {
      store.dispatch(`TimelineSpace/Modals/NewToot/${NEW_ACTION.OPEN_QUOTE}`, originalMessage.value)
    }
    const toggleSpoiler = () => {
      showContent.value = !showContent.value
      ctx.emit('sizeChanged', true)
    }
    const toggleCW = () => {
      showAttachments.value = !showAttachments.value
      ctx.emit('sizeChanged', true)
    }
    const emojiPickerShow = () => {
      emojiPickerOpened.value = true
    }
    const emojiPickerHide = () => {
      emojiPickerOpened.value = false
    }

    return {
      statusRef,
      emojiIndex,
      displayNameStyle,
      timeFormat,
      language,
      sns,
      account,
      bookmarkSupported,
      originalMessage,
      timestamp,
      readableTimestamp,
      mediaAttachments,
      reblogsCount,
      favouritesCount,
      isMyMessage,
      application,
      spoilered,
      isShowContent,
      poll,
      sensitive,
      isShowAttachments,
      filtered,
      locked,
      directed,
      quoteSupported,
      username,
      accountName,
      tootClick,
      openReply,
      openDetail,
      openBrowser,
      copyLink,
      reportUser,
      confirmMute,
      block,
      changeReblog,
      changeFavourite,
      changeBookmark,
      openImage,
      openUser,
      deleteToot,
      emojiText,
      vote,
      refresh,
      selectEmoji,
      addReaction,
      removeReaction,
      openQuote,
      toggleSpoiler,
      toggleCW,
      emojiPickerOpened,
      emojiPickerShow,
      emojiPickerHide
    }
  }
})
</script>

<style lang="scss" scoped>
.status {
  background-color: var(--theme-background-color);
}

.toot {
  padding: 8px 0 0 16px;
  position: relative;

  .fa-icon {
    font-size: 0.9em;
    width: auto;
    height: 1em;
    max-width: 100%;
    max-height: 100%;
  }

  .icon {
    float: left;

    img {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      cursor: pointer;
      display: block;
    }
  }

  .reblogger {
    color: #909399;
    padding-bottom: 8px;
    display: flex;
    align-items: center;

    .reblogger-icon {
      width: 16px;
      height: 16px;
      margin: 0 4px;

      img {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        cursor: pointer;
      }
    }

    .reblogger-name {
      font-size: calc(var(--base-font-size) * 0.86);
      cursor: pointer;
      margin: 0 4px;
    }

    .reblogger-name :deep(.emojione) {
      max-width: 10px;
      max-height: 10px;
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
        cursor: pointer;
        white-space: nowrap;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;

        span ~ span {
          padding-left: 0.5em;
        }

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

      .timestamp {
        font-size: var(--base-font-size);
        text-align: right;
        color: #909399;
        float: right;
        cursor: pointer;
      }
    }

    .spoiler {
      margin: 8px 0;

      .spoil-button {
        background-color: var(--theme-selected-background-color);
        border-color: var(--theme-border-color);
        padding: 2px 4px;
        height: 1.7rem;
        margin: 0 4px;
      }
    }

    .attachments {
      position: relative;
      margin: 4px 0 8px;

      .show-sensitive {
        padding: 20px 32px;
        margin-bottom: 4px;
      }

      .hide-sensitive {
        position: absolute;
        top: 2px;
        left: 2px;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 4px;

        &:hover {
          background-color: rgba(0, 0, 0, 0.9);
        }
      }

      .media {
        float: left;
        margin-right: 8px;
        margin-bottom: 4px;
        width: 200px;
        height: 200px;

        img {
          cursor: zoom-in;
          object-fit: cover;
          max-width: 200px;
          max-height: 200px;
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }

        .media-label {
          position: absolute;
          bottom: 6px;
          left: 4px;
          color: #fff;
          background-color: rgba(0, 0, 0, 0.3);
        }
      }
    }

    .emoji-reactions {
      .reaction {
        padding: 10px 8px;
      }
    }

    .toot-footer {
      display: flex;
      justify-content: space-between;
    }

    .tool-box {
      display: flex;
      align-items: center;
      margin: -6px 0 -6px 0;

      .fa-icon {
        vertical-align: bottom;
      }

      button {
        display: block;
        padding: 4px 8px;
        margin: 0;
        color: #909399;
      }

      .reblogged {
        color: #409eff;
      }

      .favourited {
        color: #e6a23c;
      }

      .count {
        font-size: 0.8em;
        color: #909399;
        margin: 0 0 0 -4px;

        &:blank {
          display: none;
        }
      }

      .bookmarked {
        color: #ff5050;
      }

      .pinned {
        color: gold;
      }
    }

    .application {
      color: #909399;
    }

    .reply:hover,
    .reblog:hover,
    .favourite:hover {
      color: #409eff;
    }
  }

  .action-pop-over {
    color: #303133;
  }

  .emoji-picker {
    position: absolute;
    margin-top: 4px;
    z-index: 10;
  }
}

.filtered {
  align-items: center;
  display: flex;
  height: 40px;
  justify-content: center;
}

.status:focus {
  background-color: var(--theme-selected-background-color);
  outline: 0;
}

.fill-line {
  height: 1px;
  background-color: var(--theme-border-color);
  margin: 4px 0 0;
}
</style>

<style lang="scss">
.status-menu-popper {
  padding: 2px 0 !important;
  border-color: #909399;

  .menu-list {
    padding: 0;
    margin: 4px 0;
    font-size: 0.9rem;
    list-style-type: none;
    line-height: 32px;
    text-align: left;
    color: #303133;

    li {
      box-sizing: border-box;
      padding: 0 32px 0 16px;

      &:hover {
        background-color: #409eff;
        color: #fff;
        cursor: pointer;
      }

      &.separate {
        border-top: 1px solid var(--theme-border-color);
        padding-top: 4px;
        margin-top: 2px;
      }
    }
  }
}

.status-emoji-picker {
  padding: 0;
  border: none;
}
</style>
