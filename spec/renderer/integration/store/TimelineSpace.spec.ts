import { RootState } from '@/store'
import { Entity, Response } from 'megalodon'
import { createStore, Store } from 'vuex'
import { ipcMain, ipcRenderer } from '~/spec/mock/electron'
import TimelineSpace, { TimelineSpaceState, blankAccount } from '~/src/renderer/store/TimelineSpace'
import { MyWindow } from '~/src/types/global'
;(window as any as MyWindow).ipcRenderer = ipcRenderer

const emacsEmoji: Entity.Emoji = {
  shortcode: 'emacs',
  url: 'http://example.com/emacs',
  static_url: 'http://example.com/emacs',
  visible_in_picker: true
}
const rubyEmoji: Entity.Emoji = {
  shortcode: 'ruby',
  url: 'http://example.com/ruby',
  static_url: 'http://example.com/ruby',
  visible_in_picker: true
}

const mockedInstance: Entity.Instance = {
  uri: 'http://pleroma.io',
  title: 'pleroma',
  description: '',
  email: 'test@example.com',
  version: '2.5.0 (compatible; Pleroma 0.9.0-3363-g7c5d2dc7)',
  thumbnail: null,
  urls: {
    streaming_api: 'wss://pleroma.io'
  },
  stats: {
    user_count: 10,
    status_count: 1000,
    domain_count: 100
  },
  languages: ['en'],
  contact_account: null,
  max_toot_chars: 5000
}

const mockClient = {
  getInstance: () => {
    return new Promise<Response<Entity.Instance>>(resolve => {
      const res: Response<Entity.Instance> = {
        data: mockedInstance,
        status: 200,
        statusText: 'OK',
        headers: {}
      }
      resolve(res)
    })
  },
  getInstanceCustomEmojis: () => {
    return new Promise<Response<Array<Entity.Emoji>>>(resolve => {
      const res: Response<Array<Entity.Emoji>> = {
        data: [emacsEmoji, rubyEmoji],
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
  detector: jest.fn(() => 'pleroma'),
  default: jest.fn(() => mockClient),
  __esModule: true
}))

const state = (): TimelineSpaceState => {
  return {
    account: blankAccount,
    bindingAccount: null,
    loading: false,
    emojis: [],
    tootMax: 500,
    timelineSetting: {
      unreadNotification: {
        direct: true,
        local: true,
        public: true
      },
      useMarker: {
        home: false,
        notifications: true,
        mentions: false
      }
    },
    sns: 'mastodon',
    filters: []
  }
}

const homeStore = {
  namespaced: true,
  actions: {
    fetchTimeline: jest.fn()
  }
}

const notificationStore = {
  namespaced: true,
  actions: {
    fetchNotifications: jest.fn()
  }
}

const DMStore = {
  namespaced: true,
  actions: {
    fetchTimeline: jest.fn()
  }
}

const LocalStore = {
  namespaced: true,
  actions: {
    fetchLocalTimeline: jest.fn()
  }
}

const PublicStore = {
  namespaced: true,
  actions: {
    fetchPublicTimeline: jest.fn()
  }
}

const MentionStore = {
  namespaced: true,
  actions: {
    fetchMentions: jest.fn()
  }
}

const contentsStore = {
  namespaced: true,
  modules: {
    Home: homeStore,
    Notifications: notificationStore,
    DirectMessages: DMStore,
    Local: LocalStore,
    Public: PublicStore,
    Mentions: MentionStore
  },
  actions: {
    changeLoading: jest.fn()
  }
}

const initStore = () => {
  return {
    namespaced: true,
    modules: {
      Contents: contentsStore
    },
    state: state(),
    actions: TimelineSpace.actions,
    mutations: TimelineSpace.mutations
  }
}

const appState = {
  namespaced: true,
  state: {
    proxyConfiguration: false
  }
}

describe('TimelineSpace', () => {
  let store: Store<RootState>

  beforeEach(() => {
    store = createStore({
      modules: {
        TimelineSpace: initStore(),
        App: appState
      }
    })
  })

  describe('localAccount', () => {
    describe('account already exists', () => {
      beforeEach(() => {
        ipcMain.handle('get-local-account', () => {
          return {
            username: 'test'
          }
        })
      })
      afterEach(() => {
        ipcMain.removeHandler('get-local-account')
      })
      it('should be updated', async () => {
        await store.dispatch('TimelineSpace/localAccount', 1)
        expect(store.state.TimelineSpace.account.username).toEqual('test')
      })
    })

    describe('account does not exist', () => {
      beforeEach(() => {
        ipcMain.handle('get-local-account', () => {
          return {}
        })
        ipcMain.handle('update-account', () => {
          return {
            username: 'fetched'
          }
        })
      })
      afterEach(() => {
        ipcMain.removeHandler('get-local-account')
        ipcMain.removeHandler('update-account')
      })
      it('should be fetched', async () => {
        await store.dispatch('TimelineSpace/localAccount', 1)
        expect(store.state.TimelineSpace.account.username).toEqual('fetched')
      })
    })
  })

  describe('detectSNS', () => {
    describe('API is pleroma', () => {
      it('should be detected', async () => {
        await store.dispatch('TimelineSpace/detectSNS')
        expect(store.state.TimelineSpace.sns).toEqual('pleroma')
      })
    })
  })

  describe('fetchEmojis', () => {
    it('should be updated', async () => {
      await store.dispatch('TimelineSpace/fetchEmojis', {})
      expect(store.state.TimelineSpace.emojis).toEqual([emacsEmoji, rubyEmoji])
    })
  })

  describe('fetchInstance', () => {
    it('should be updated', async () => {
      await store.dispatch('TimelineSpace/fetchInstance', {})
      expect(store.state.TimelineSpace.tootMax).toEqual(mockedInstance.max_toot_chars)
    })
  })

  describe('loadUnreadNotification', () => {
    describe('success', () => {
      it('should be updated', async () => {
        ipcMain.handle('get-account-setting', () => {
          return {
            accountID: 'sample',
            timeline: {
              unreadNotification: {
                direct: false,
                local: false,
                public: false
              }
            }
          }
        })
        await store.dispatch('TimelineSpace/loadTimelineSetting')
        expect(store.state.TimelineSpace.timelineSetting).toEqual({
          unreadNotification: {
            direct: false,
            local: false,
            public: false
          }
        })
        ipcMain.removeHandler('get-account-setting')
      })
    })
  })

  describe('fetchContentsTimelines', () => {
    it('should be called', async () => {
      await store.dispatch('TimelineSpace/fetchContentsTimelines', {})
      expect(homeStore.actions.fetchTimeline).toHaveBeenCalled()
      expect(notificationStore.actions.fetchNotifications).toHaveBeenCalled()
      expect(DMStore.actions.fetchTimeline).toHaveBeenCalled()
      expect(LocalStore.actions.fetchLocalTimeline).toHaveBeenCalled()
      expect(PublicStore.actions.fetchPublicTimeline).toHaveBeenCalled()
    })
  })
})
