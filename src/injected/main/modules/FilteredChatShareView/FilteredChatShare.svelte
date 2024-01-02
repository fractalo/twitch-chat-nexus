<script lang="ts">
  import * as htmlToImage from 'html-to-image';
  import IconButton from '../../components/IconButton.svelte';
  import { faFileImage, faGear, faRotate, faRotateRight, faSliders, faUserCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
  import { i18n } from 'src/i18n';
  import { filteredChatMessages } from '../FilteredChatView/stores';
  import type { ChatMessage, RenderedChatMessage } from '../FilteredChatView/types';
  import { afterUpdate, onDestroy, onMount, tick } from 'svelte';
  import { saveAs } from 'file-saver';
  import dayjs from 'dayjs'
  import type { Action } from 'svelte/action';
  import { joinedChatChannelStore } from '../../stores';
  import Dropdown from '../../components/Dropdown.svelte';
  import Tooltip from '../../components/Tooltip.svelte';
  import type { SelectableChatMessage, SelectableChatUser, TimestampFormat } from './types';
  import { waitForSelector } from 'src/util/waitForSelector';
  import { DEFAULT_IMAGE_WIDTH_PIXEL, PIXEL_RATIOS, TIMESTAMP_FORMATS, getStoredImagePixelRatio, getStoredImageWidthPixel, getStoredTimestampFormat, getValidImageWidthPixel, storeImagePixelRatio, storeImageWidthPixel, storeTimestampFormat } from './outputOptions';
  import DropdownTooltipIconButton from '../../components/DropdownTooltipIconButton.svelte';

  

  let simplebarRootEl: HTMLElement | undefined;
  let messageContainerEl: HTMLElement | undefined;

  let chatMessageById: Map<string, SelectableChatMessage> = new Map();
  let chatMessages: SelectableChatMessage[] = [];

  let chatUserById: Map<string, SelectableChatUser> = new Map();
  let chatUsers: SelectableChatUser[] = [];

  let isLoading: boolean = false;

  let timestampFormat: TimestampFormat = getStoredTimestampFormat();

  let imageWidthPixel: number = getStoredImageWidthPixel();
  let prevImageWidthPixel = imageWidthPixel;

  let pixelRatio: number = getStoredImagePixelRatio();

  const resetImageWidthPixel = () => {
    storeImageWidthPixel(prevImageWidthPixel = imageWidthPixel = DEFAULT_IMAGE_WIDTH_PIXEL);
  };

  const wrapChatMessage: Action<HTMLElement, number> = (node, index) => {
    node.replaceChildren(chatMessages[index].element);
    return {
      update(index) {
        node.replaceChildren(chatMessages[index].element);
      }
    }
  };

  const wrapChatUser: Action<HTMLElement, number> = (node, index) => {
    const element = chatUsers[index].element;
    element && node.replaceChildren(element);
    return {
      update(index) {
        const element = chatUsers[index].element;
        element && node.replaceChildren(element);
      }
    }
  };

  const createUsernameEl = (chatMessage: ChatMessage) => {
    const { userLogin, userDisplayName, userColor } = chatMessage;

    const usernameEl = document.createElement('span');
    usernameEl.className = 'chat-line__username';
    usernameEl.style.color = userColor ?? '';

    const displayNameEl = document.createElement('span');
    displayNameEl.className = 'chat-author__display-name';
    displayNameEl.textContent = userDisplayName || userLogin || '';
    usernameEl.append(displayNameEl);

    if (userDisplayName && userLogin && userLogin.toLowerCase() !== userDisplayName.toLowerCase()) {
      const loginNameEl = document.createElement('span');
      loginNameEl.className = 'chat-author__intl-login';
      loginNameEl.textContent = ` (${userLogin})`;
      usernameEl.append(loginNameEl);
    }
    
    return usernameEl;
  };

  const createUsernameContainerEl = (chatMessage: SelectableChatMessage) => {
    const { message, element } = chatMessage;

    let containerEl = element.querySelector('.chat-line__username-container');
    if (containerEl) {
      return containerEl.cloneNode(true);
    }
    
    containerEl = document.createElement('div');
    containerEl.setAttribute('data-room-id', element.getAttribute('data-room-id') ?? '');

    const badgeEl = element.querySelector('.chat-line__message--badges'); // frankerfacez
    if (badgeEl) {
      containerEl.append(badgeEl.cloneNode(true));
    }

    const usernameEl = element.querySelector('.chat-line__username')?.cloneNode(true) ?? createUsernameEl(message);
    containerEl.append(usernameEl);

    return containerEl;
  };

  const updateChatMessages = () => {
    chatMessages = $filteredChatMessages.map(chatMessage => {
      const { element, message } = chatMessage;

      const prevChatMessage = chatMessageById.get(message.id);

      const clonedEl = element.cloneNode(true) as Element;

      clonedEl.querySelector('.chat-line__timestamp')?.remove();

      const selectableChatMessage: SelectableChatMessage = {
        element: clonedEl, 
        message, 
        isChecked: prevChatMessage ? prevChatMessage.isChecked : true, 
      };

      updateTimestampEl(selectableChatMessage);

      return selectableChatMessage;
    });

    chatMessageById = chatMessages.reduce((map, chatMessage) => {
      map.set(chatMessage.message.id, chatMessage);
      return map;
    }, new Map<string, SelectableChatMessage>());

    chatUserById = chatMessages.reduceRight((map, chatMessage) => {
      const { userLogin, userDisplayName } = chatMessage.message;
      if (!userLogin) return map;

      let user = map.get(userLogin);
      if (user) {
        user.userDisplayName ??= userDisplayName;
        user.element ??= createUsernameContainerEl(chatMessage) as Element;
        if (user.isChecked !== chatMessage.isChecked) {
          user.isIndeterminate = true;
        }
        user.isChecked = chatMessage.isChecked || user.isChecked;
        user.chatMessages.push(chatMessage);
      } else {
        map.set(userLogin, {
          userLogin,
          userDisplayName,
          element: createUsernameContainerEl(chatMessage) as Element,
          isChecked: chatMessage.isChecked,
          isIndeterminate: false,
          chatMessages: [chatMessage],
        });
      }
      return map;
    }, new Map<string, SelectableChatUser>());

    chatUsers = [...chatUserById.values()].sort((a, b) => {
      const aName = (a.userDisplayName || a.userLogin);
      const bName = (b.userDisplayName || b.userLogin);
      return aName.localeCompare(bName);
    });

  }; 

  const handleClickSave = async() => {
    if (!messageContainerEl || isLoading) return;

    isLoading = true;
    await tick();
    
    let blob: Blob | null = null;
    try {
      const backgroundColor = getComputedStyle(document.body).getPropertyValue('--color-background-base');

      blob = await htmlToImage.toBlob(messageContainerEl, {
        skipFonts: true,
        backgroundColor,
        pixelRatio,
      });
    } catch (error) {
      console.error(error);
    } finally {
      isLoading = false;
    }

    blob && saveAs(blob, `${$joinedChatChannelStore}-chat-${dayjs().format('YYYYMMDD_HHmmss')}.png`);
  };

  const handleClickRefresh = () => {
    if (isLoading) return;
    updateChatMessages();
  };
  
  const timestampTemplates: Record<TimestampFormat, string> = {
    'hidden': '',
    '12-hour': 'h:mm',
    '24-hour': 'H:mm',
  };

  const updateTimestampEl = (chatMessage: SelectableChatMessage) => {
    let { element, timestampEl, message } = chatMessage;
    if (timestampFormat === 'hidden') {
      return timestampEl?.remove();
    }

    if (!message.timestamp) return;

    if (!timestampEl) {
      timestampEl = document.createElement('span');
      timestampEl.className = 'chat-line__timestamp';
      chatMessage.timestampEl = timestampEl;
    }

    timestampEl.textContent = dayjs(message.timestamp).format(timestampTemplates[timestampFormat]);

    if (!element.contains(timestampEl)) {
      element.querySelector('.chat-line__username-container, .chat-line__username')
          ?.parentElement?.prepend(timestampEl);
    }
  };

  const handleTimestampFormatChange = () => {
    chatMessages.forEach(updateTimestampEl);
    storeTimestampFormat(timestampFormat);
  };

  const handleImageWidthPixelChange = () => {
    imageWidthPixel = getValidImageWidthPixel(imageWidthPixel, prevImageWidthPixel);
    prevImageWidthPixel = imageWidthPixel;
    storeImageWidthPixel(imageWidthPixel);
  };
  

  $: selectedCount = chatMessages.reduce((count, chatMessage) => {
    return chatMessage.isChecked ? count + 1 : count;
  }, 0);

  $: isAllSelected = selectedCount === chatMessages.length;
  $: isNoneSelected = selectedCount === 0;

  const toggleAllChat = () => {
    chatMessages.forEach(chatMessage => chatMessage.isChecked = isNoneSelected);
    chatUsers.forEach(chatUser => {
      chatUser.isChecked = isNoneSelected;
      chatUser.isIndeterminate = false;
    });
    chatMessages = chatMessages;
    chatUsers = chatUsers;
  };

  const handleUserSelectChange = (chatUser: SelectableChatUser) => {
    chatUser.chatMessages.forEach(chatMessage => chatMessage.isChecked = chatUser.isChecked);
    chatMessages = chatMessages;
  };

  const handleMessageSelectChange = (chatMessage: SelectableChatMessage) => {
    const { userLogin } = chatMessage.message;
    if (!userLogin) return;

    const chatUser = chatUserById.get(userLogin);
    if (!chatUser) return;

    chatUser.isChecked = chatUser.chatMessages.some(chatMessage => chatMessage.isChecked);
    chatUser.isIndeterminate = chatUser.isChecked && chatUser.chatMessages.some(chatMessage => !chatMessage.isChecked);

    chatUsers = chatUsers;
  };

  handleClickRefresh();

  let isCheckByDragEnabled: boolean = false;

  

  let isDestroyed = false;
  const abortController = new AbortController();

  onMount(() => {
    waitForSelector(
      ".simplebar-scroll-content", 
      simplebarRootEl, 
      abortController.signal
    )
    .then(element => {
        if (isDestroyed) return;
        element.scrollTo(0, element.scrollHeight);
    })
    .catch(() => console.error('cannot find scrollContent of filtered chat share list!'));
  });

  onDestroy(() => {
    isDestroyed = true;
    abortController.abort();
  });

</script>

<svelte:document on:mouseup={() => isCheckByDragEnabled = false} />

<div class="flex flex-col">
  <div class="flex px-2 py-1 justify-between items-center">
    <div class="flex gap-2 items-center">
      <Tooltip text={$i18n.t(isNoneSelected ? 'selectAll' : 'deselectAll')} placement="top-start" isDelayed={false}>
        <label class="daisy-label cursor-pointer" >
          <input type="checkbox" class="daisy-checkbox daisy-checkbox-primary" 
            disabled={isLoading} 
            checked={!isNoneSelected} 
            indeterminate={!isAllSelected && !isNoneSelected}
            on:change={toggleAllChat}
          />
        </label>
      </Tooltip>
      <span>{$i18n.t('nSelected', { count: selectedCount })}</span>
    </div>

    <div class="flex gap-2 items-center">
      <Tooltip text={$i18n.t('refresh')} placement="top" isDelayed={false} >
        <IconButton type="ghost" icon={faRotateRight} disabled={isLoading}
          on:click={handleClickRefresh}
        />
      </Tooltip>

      <Dropdown useAutoToggle={false} >
        <DropdownTooltipIconButton 
          slot="button"
          let:toggleDropdown
          let:isDropdownOpen
          {toggleDropdown}
          {isDropdownOpen}

          tooltipText={$i18n.t('filteredChatShare.selectByUser', { ns: 'mainApp' })}
          tooltipPlacement="top-end"
          isTooltipDelayed={false}

          buttonType="ghost"
          buttonIcon={faUserCheck}
          isButtonDisabled={isLoading}
        />
  
        <div slot="body" let:isDropdownOpen class="tcn-card flex flex-col p-2 rounded-[0.6rem] w-[26rem] absolute right-0 z-10" class:hidden={!isDropdownOpen}>
          <div class="h-[18rem] overflow-hidden">
            <div class="scrollable-area" data-simplebar>
              <div>
                {#each chatUsers as chatUser, i (chatUser.userLogin)}
                  <div class="flex items-center">
                    <label class="daisy-label cursor-pointer px-2" >
                      <input type="checkbox" class="daisy-checkbox daisy-checkbox-primary" 
                        bind:checked={chatUsers[i].isChecked} 
                        bind:indeterminate={chatUsers[i].isIndeterminate}
                        on:change={() => handleUserSelectChange(chatUser)}
                      />
                    </label>
                    <div class="grow min-w-0" use:wrapChatUser={i} ></div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  </div>

  <div class="h-[24rem] overflow-hidden pl-2">
    {#if isLoading}
      <div class="flex justify-center items-center h-full w-full">
        <div class="daisy-loading daisy-loading-spinner daisy-loading-lg"></div>
      </div>
    {/if}
    <div class="scrollable-area" data-simplebar
      bind:this={simplebarRootEl}
    >
      <div bind:this={messageContainerEl} style:width={isLoading ? `${imageWidthPixel}px` : ''} >
        {#each chatMessages as chatMessage, i (chatMessage.message.id)}
          {#if !isLoading || chatMessages[i].isChecked}
            <div class="flex" >
              {#if !isLoading}
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <label class="daisy-label cursor-pointer" 
                  on:mousedown={(event) => {
                    if (event.button !== 0) return;
                    chatMessages[i].isChecked = !chatMessages[i].isChecked;
                    isCheckByDragEnabled = true;
                  }}
                  on:mouseenter={() => {
                    if (isCheckByDragEnabled) {
                      chatMessages[i].isChecked = !chatMessages[i].isChecked;
                    }
                  }}
                >
                  <input type="checkbox" class="daisy-checkbox daisy-checkbox-primary" 
                    bind:checked={chatMessages[i].isChecked} 
                    on:change={() => handleMessageSelectChange(chatMessage)}
                    on:click|preventDefault
                  />
                </label>
              {/if}
              <div class="grow min-w-0" class:opacity-50={!chatMessages[i].isChecked} 
                use:wrapChatMessage={i}
              ></div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <div class="tcn-card-button-group flex justify-start px-2 py-4 tcn-card-handle">
    <div class="flex gap-2 pl-2 grow">
      <IconButton icon={faFileImage} text={$i18n.t('filteredChatShare.saveAsImage', { ns: 'mainApp' })} type="primary" textPosition="right" 
        on:click={handleClickSave}
        disabled={isLoading || isNoneSelected}
      />
    </div>
    <Dropdown>
      <DropdownTooltipIconButton 
        slot="button"
        let:toggleDropdown
        let:isDropdownOpen
        {toggleDropdown}
        {isDropdownOpen}

        tooltipText={$i18n.t('filteredChatShare.imageSaveOptions', { ns: 'mainApp' })}
        tooltipPlacement="left"

        buttonType="ghost"
        buttonIcon={faSliders}
      />

      <div slot="body" class="tcn-card flex flex-col px-4 pt-1 pb-4 rounded-[0.6rem] w-[18rem] absolute right-0 bottom-full top-auto z-10 tcn-card-drag-cancel" >
        <div class="flex w-full justify-center py-2">
          <span class="tcn-card-title-sm">{$i18n.t('filteredChatShare.imageSaveOptions', { ns: 'mainApp' })}</span>
        </div>
        <div class="daisy-form-control">
          <label for="tcn-share-timestamp-format" class="daisy-label">
            <span class="daisy-label-text">{$i18n.t('timestamp')}</span>
          </label>
          <select 
            id="tcn-share-timestamp-format"
            class="daisy-select"
            bind:value={timestampFormat}
            on:change={handleTimestampFormatChange}
          >
            {#each TIMESTAMP_FORMATS as format}
              <option value={format}>{$i18n.t(`filteredChatShare.timestamp.${format}`, { ns: 'mainApp' })}</option>
            {/each}
          </select>
        </div>
        <div class="daisy-form-control">
          <label for="tcn-share-image-width" class="daisy-label">
            <span class="daisy-label-text">{$i18n.t('filteredChatShare.width', { ns: 'mainApp' })} (px)</span>
          </label>
          <div class="flex gap-2">
            <input 
              type="number" 
              min="10"
              id="tcn-share-image-width"
              class="daisy-input min-w-0 grow"
              bind:value={imageWidthPixel}
              on:change={handleImageWidthPixelChange}
            />
            <Tooltip 
              text={$i18n.t('resetToDefault')} 
              placement="bottom" 
              isDelayed={false} 
            >
              <IconButton 
                type="ghost" 
                icon={faXmark} 
                on:click={resetImageWidthPixel} 
              />
            </Tooltip>
          </div>
        </div>
        <div class="daisy-form-control">
          <label for="tcn-share-pixel-ratio" class="daisy-label">
            <span class="daisy-label-text">{$i18n.t('filteredChatShare.scale', { ns: 'mainApp' })}</span>
          </label>
          <select 
            id="tcn-share-pixel-ratio"
            class="daisy-select"
            bind:value={pixelRatio}
            on:change={() => storeImagePixelRatio(pixelRatio)}
          >
            {#each PIXEL_RATIOS as ratio}
              <option value={ratio}>{Math.floor(ratio * 100)}%</option>
            {/each}
          </select>
        </div>
      </div>
    </Dropdown>
  </div>
</div>
