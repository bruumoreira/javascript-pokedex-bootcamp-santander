const cardElements = document.querySelectorAll('.card');
const buttonElements = document.querySelectorAll('.pokemon-select');

const SOUNDS_DIR = 'public/sounds/';

const SOUND_FILE = 'sound-effect.mp3';

const CASCADING_STYLE_STATUS_CLASS = {
  button: 'checked',
  card: 'visible',
};

class PokemonSounds {
  constructor(options = {}) {
    const { files = [SOUND_FILE] } = options;

    this.audioElement = document.createElement('audio');

    this.sounds = files.map((file) => ({
      src: SOUNDS_DIR + file,
      alt: file,
      name: file,
    }));
  }

  calculateVolume(volumeString) {
    const VOLUME = 0.2; // 20%

    const isPercent =
      typeof volumeString === 'string' && volumeString.endsWith('%');

    function calculate(volString) {
      const [percent] = volString.split('%');

      return Number(percent) / (100 * 1);
    }

    return isPercent ? calculate(volumeString) : VOLUME;
  }

  _findSoundByPartialName(partialName) {
    return this.sounds.find(({ name }) => name.startsWith(partialName));
  }

  _setAttributes(audio, attributes) {
    const attributeKeys = Object.keys(attributes);

    for (const key of attributeKeys) {
      const attributeValue = attributes[key];

      switch (key) {
        case 'volume':
          audio.volume = attributeValue;
        default:
          audio.setAttribute(key, attributeValue);
      }
    }
  }

  play(partialAudioName = 'sound-effect.mp3') {
    const soundInformation = this._findSoundByPartialName(partialAudioName);

    if (soundInformation) {
      const htmlAudioElement = this.audioElement;

      this._setAttributes(htmlAudioElement, {
        ...soundInformation,
        volume: this.calculateVolume('1%'),
      });

      setTimeout(() => {
        htmlAudioElement.play();
      }, 100);
    }
  }
}

class PokemonStorage {
  _key_prefix = 'pokemon_storage_devmap:';

  constructor() {}

  set(key, data) {

    const storageKey = this._key_prefix + key;

    const parsed = this._serialize(data);

    localStorage.setItem(storageKey, parsed);

    return { parsed, data };
  }

  get(key) {
    const storageKey = this._key_prefix + key;

    const data = localStorage.getItem(storageKey);

    return this._deserialize(data);
  }

  _serialize(object) {
    return JSON.stringify(object);
  }

  _deserialize(json) {
    return JSON.parse(json);
  }
}

class Pokemon {
  datasetIdKey = 'pokemonCardId';
  storageKey = 'select_card'; 

  constructor({ cards, buttons, storage, sounds }) {
    this.storage = storage;
    this.sound = sounds;

    this.cards = [...cards];
    this.buttons = [...buttons];
  }

  init() {
    const buttonsElements = this.buttons;

    buttonsElements.forEach((button) => {
      button.addEventListener('click', (event) => this.handle(event));
    });
  }

  buttonDisabled(element, elementType = 'button') {
    const hasNotAttributeInElement = !element.hasAttribute('disabled');

    const isValidHTMLElement = element.tagName === elementType.toUpperCase();

    if (hasNotAttributeInElement && isValidHTMLElement) {
      element.setAttribute('disabled', 'true');
    }
  }

  buttonEnabled(element) {
    const isButtonElement = element.tagName === 'button'.toUpperCase();

    if (isButtonElement) element.removeAttribute('disabled');
  }

  _getDatasetValue(element, key = 'id') {
    return element.dataset[key];
  }

  _containsClassName(element, className) {
    return element.classList.contains(className);
  }

  _setClassName(element, className) {
    element.classList.add(className);
  }

  _removeAllClassNames(elements, className, enableButton = true) {
    for (const element of elements) {
      if (enableButton) this.buttonEnabled(element);

      const hasClassName = this._containsClassName(element, className);

      if (hasClassName) {
        element.classList.remove(className);
      }
    }
  }

  _findIndexDataset(elements, key, expected) {
    return elements.findIndex(
      (element) =>
        Number(this._getDatasetValue(element, key)) === Number(expected)
    );
  }

  setElementState({ elements, current, className }, { play = false }) {
    this._removeAllClassNames(elements, className);

    this._setClassName(current, className); 

    this.buttonDisabled(current);

    if (play) this.sound.play();
  }

  setState(state, extras = {}) {
    const stateKeys = Object.keys(state);

    const keysLessThanOne = stateKeys.length < 1;

    if (keysLessThanOne) return null;

    for (const key of stateKeys) {
      const { elements, current, className } = state[key];

      this.setElementState({ elements, current, className }, extras);
    }
  }

  mekeState(options) {
    const { button, card } = options;

    const [buttonIsInt, cardIsInt] = Object.keys(options).map((key) => {
      return typeof options[key] === 'number' && Number.isInteger(options[key]);
    });

    const currentButtonElement = buttonIsInt ? this.buttons[button] : button;

    const currentCardElement = cardIsInt ? this.cards[card] : card;

    const state = {
      button: {
        elements: this.buttons,
        current: currentButtonElement,
        className: CASCADING_STYLE_STATUS_CLASS.button,
      },

      card: {
        elements: this.cards,
        current: currentCardElement,
        className: CASCADING_STYLE_STATUS_CLASS.card,
      },
    };

    console.debug({
      bool: { buttonIsInt, cardIsInt },
      state,
    });

    return state;
  }

  handle(event) {
    const { currentTarget: button } = event;

    const id = button.dataset.id;

    const cardIndex = this._findIndexDataset(this.cards, this.datasetIdKey, id);

    const state = this.mekeState({ button, card: cardIndex });

    this.setState({ ...state }, { play: true });

    const pokemonStorageKey = this.storageKey;

    this.storage.set(pokemonStorageKey, { index: cardIndex });
  }

  load() {
    const storageKey = this.storageKey;

    const storageItem = this.storage.get(storageKey) || {};

    const { index } = Object.assign({ index: 0 }, storageItem);

    const state = this.mekeState({
      button: index,
      card: index,
    });

    this.setState({
      ...state,
    });

    return this;
  }
}

function application() {
  const storage = new PokemonStorage();

  const sounds = new PokemonSounds();

  const pokemon = new Pokemon({
    storage,
    sounds,
    cards: cardElements,
    buttons: buttonElements,
  });

  pokemon.load().init();
}

window.addEventListener('load', () => application());
