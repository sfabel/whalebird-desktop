import { Response, Entity } from 'megalodon'
import { createStore, Store } from 'vuex'
import Notifications, { NotificationsState } from '@/store/TimelineSpace/Contents/Notifications'
import { RootState } from '@/store'

const mockClient = {
  getNotifications: () => {
    return new Promise<Response<Array<Entity.Notification>>>(resolve => {
      const res: Response<Array<Entity.Notification>> = {
        data: [notification1],
        status: 200,
        statusText: 'OK',
        headers: {}
      }
      resolve(res)
    })
  }
}

jest.mock('megalodon', () => ({
  ...jest.requireActual<object>('megalodon'),
  default: jest.fn(() => mockClient),
  __esModule: true
}))

const account1: Entity.Account = {
  id: '1',
  username: 'h3poteto',
  acct: 'h3poteto@pleroma.io',
  display_name: 'h3poteto',
  locked: false,
  created_at: '2019-03-26T21:30:32',
  followers_count: 10,
  following_count: 10,
  statuses_count: 100,
  note: 'engineer',
  url: 'https://pleroma.io',
  avatar: '',
  avatar_static: '',
  header: '',
  header_static: '',
  emojis: [],
  moved: null,
  fields: null,
  bot: false
}

const account2: Entity.Account = {
  id: '2',
  username: 'h3poteto',
  acct: 'h3poteto@mstdn.io',
  display_name: 'h3poteto',
  locked: false,
  created_at: '2019-03-26T21:30:32',
  followers_count: 10,
  following_count: 10,
  statuses_count: 100,
  note: 'engineer',
  url: 'https://mstdn.io',
  avatar: '',
  avatar_static: '',
  header: '',
  header_static: '',
  emojis: [],
  moved: null,
  fields: null,
  bot: false
}

const status1: Entity.Status = {
  id: '1',
  uri: 'http://example.com',
  url: 'http://example.com',
  account: account1,
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  reblog: null,
  content: 'hoge',
  plain_content: 'hoge',
  created_at: '2019-03-26T21:40:32',
  emojis: [],
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  reblogged: null,
  favourited: null,
  muted: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  media_attachments: [],
  mentions: [],
  tags: [],
  card: null,
  poll: null,
  application: {
    name: 'Web'
  } as Entity.Application,
  language: null,
  pinned: null,
  emoji_reactions: [],
  bookmarked: false,
  quote: false
}

const status2: Entity.Status = {
  id: '2',
  uri: 'http://example.com',
  url: 'http://example.com',
  account: account1,
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  reblog: null,
  content: 'hoge',
  plain_content: 'hoge',
  created_at: '2019-03-26T21:40:32',
  emojis: [],
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  reblogged: null,
  favourited: null,
  muted: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  media_attachments: [],
  mentions: [],
  tags: [],
  card: null,
  poll: null,
  application: {
    name: 'Web'
  } as Entity.Application,
  language: null,
  pinned: null,
  emoji_reactions: [],
  bookmarked: false,
  quote: false
}

const rebloggedStatus: Entity.Status = {
  id: '3',
  uri: 'http://example.com',
  url: 'http://example.com',
  account: account1,
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  reblog: status2,
  content: 'hoge',
  plain_content: 'hoge',
  created_at: '2019-03-26T21:40:32',
  emojis: [],
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  reblogged: null,
  favourited: null,
  muted: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  media_attachments: [],
  mentions: [],
  tags: [],
  card: null,
  poll: null,
  application: {
    name: 'Web'
  } as Entity.Application,
  language: null,
  pinned: null,
  emoji_reactions: [],
  bookmarked: false,
  quote: false
}

const notification1: Entity.Notification = {
  id: '1',
  account: account2,
  status: status1,
  type: 'favourite',
  created_at: '2019-04-01T17:01:32'
}

const notification2: Entity.Notification = {
  id: '2',
  account: account2,
  status: rebloggedStatus,
  type: 'mention',
  created_at: '2019-04-01T17:01:32'
}

let state = (): NotificationsState => {
  return {
    lazyLoading: false,
    heading: true,
    scrolling: false,
    notifications: []
  }
}

const initStore = () => {
  return {
    namespaced: true,
    state: state(),
    actions: Notifications.actions,
    mutations: Notifications.mutations
  }
}

const contentsStore = () => ({
  namespaced: true,
  modules: {
    Notifications: initStore()
  }
})

const timelineStore = () => ({
  namespaced: true,
  state: {
    account: {
      accessToken: 'token',
      baseURL: 'http://localhost'
    },
    timelineSetting: {
      useMarker: {
        home: false,
        notifications: false,
        mentions: false
      }
    }
  },
  modules: {
    Contents: contentsStore()
  }
})

const appState = {
  namespaced: true,
  state: {
    proxyConfiguration: false,
    useMarkerTimeline: []
  }
}

describe('Notifications', () => {
  let store: Store<RootState>

  beforeEach(() => {
    store = createStore({
      modules: {
        TimelineSpace: timelineStore(),
        App: appState
      }
    })
  })

  describe('fetchNotifications', () => {
    it('should be updated', async () => {
      const response = await store.dispatch('TimelineSpace/Contents/Notifications/fetchNotifications')
      expect(response).toEqual([notification1])
      expect(store.state.TimelineSpace.Contents.Notifications.notifications).toEqual([notification1])
    })
  })

  describe('lazyFetchNotifications', () => {
    beforeAll(() => {
      state = () => {
        return {
          lazyLoading: false,
          heading: true,
          scrolling: false,
          notifications: [notification1]
        }
      }
    })
    it('should be updated', async () => {
      mockClient.getNotifications = () => {
        return new Promise<Response<Array<Entity.Notification>>>(resolve => {
          const res: Response<Array<Entity.Notification>> = {
            data: [notification2],
            status: 200,
            statusText: 'OK',
            headers: {}
          }
          resolve(res)
        })
      }
      await store.dispatch('TimelineSpace/Contents/Notifications/lazyFetchNotifications', notification1)
      expect(store.state.TimelineSpace.Contents.Notifications.lazyLoading).toEqual(false)
      expect(store.state.TimelineSpace.Contents.Notifications.notifications).toEqual([notification1, notification2])
    })
  })
})
