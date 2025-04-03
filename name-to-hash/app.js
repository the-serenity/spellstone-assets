var base64chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!~',
  runeDelimiter = '/',
  indexDelimiter = '-',
  priorityDelimiter = '|',
  noFusionInHash = {};
for (var id in CARDS) {
  if (id < 1e4)
    (!(fusion = FUSIONS[id]) || Number(fusion) < 1e4) &&
      (noFusionInHash[id] = !0);
}
var maxRuneID = 1e3;

var CardPrototype,
  defaultStatusValues = {
    attack_berserk: 0,
    attack_valor: 0,
    attack_rally: 0,
    attack_weaken: 0,
    attack_corroded: 0,
    corrosion_timer: 0,
    mark_target: 0,
    attackIncreasePrevention: 0,
    barrier_ice: 0,
    corroded: 0,
    enfeebled: 0,
    enraged: 0,
    envenomed: 0,
    heartseeker: 0,
    imbued: 0,
    invigorated: 0,
    invisible: 0,
    nullified: 0,
    poisoned: 0,
    protected: 0,
    scorched: 0,
    warded: 0,
    confused: !(Function.prototype.throttle = function (wait) {
      var timeout,
        func = this;
      return function () {
        var context = this,
          args = arguments;
        timeout ||
          (func.apply(context, args),
          (timeout = setTimeout(function () {
            (timeout = null), func.apply(context, args);
          }, wait)));
      };
    }),
    jammed: !1,
    jammedSelf: !1,
    silenced: !1,
    bash_triggered: !1,
    dualstrike_triggered: !1,
    ondeath_triggered: !1,
    reanimated: !1,
  };

function loadCard(id) {
  return CARDS[id];
}

function is_commander(id) {
  var card = loadCard(id);
  return card && '1' == card.card_type;
}

function makeUnitInfo(id, level, runes) {
  var unit = {
    id: Number(id),
    level: Number(level),
    runes: [],
  };
  return runes && (unit.runes = runes), unit;
}

const elariaCaptain = makeUnitInfo(202, 1);

function cleanCardName(name) {
  return name.replace(/[^a-zA-Z0-9]$/, '');
}

function getCardName(unitId) {
  const nameArr = CARDS[unitId].name.split(' ');
  let name = CARDS[unitId] ? cleanCardName(nameArr[0]) : 'Unknown';
  if (name === 'The' || name === 'Uncommon') {
    name = CARDS[unitId].name;
  }
  return name;
}

function decimal_to_base64(dec, len) {
  for (var base64 = '', i = 0; i < len; i++) {
    var part = dec % 64;
    (base64 += base64chars[part]), (dec = (dec - part) / 64);
  }
  return base64;
}

function base64_to_decimal(base64) {
  for (var dec = 0, i = base64.length - 1; 0 <= i; i--) {
    (dec *= 64), (dec += base64chars.indexOf(base64[i]));
  }
  return dec;
}

function runeID_to_decimal(runeID) {
  if (0 == runeID) return 0;
  var runeLevel = (runeID = parseInt(runeID) % 5e3) % 10,
    runeType = (runeID - runeLevel) / 10;
  return (runeID = runeID = 5 * runeType + runeLevel - 1);
}

function base64_to_runeID(base64) {
  return decimal_to_runeID(
    base64chars.indexOf(base64[0]) + 64 * base64chars.indexOf(base64[1])
  );
}

function decimal_to_runeID(decimal) {
  var runeLevel = decimal % 5,
    runeType = (decimal - runeLevel) / 5;
  return 0 == runeType ? 0 : 10 * runeType + runeLevel + 5001;
}

function numberToBase64(decimal) {
  return base64chars[Math.floor(decimal / 64)] + base64chars[decimal % 64];
}

function base64ToNumber(base64) {
  return 64 * base64chars.indexOf(base64[0]) + base64chars.indexOf(base64[1]);
}

function unitInfo_format_to_sim(unit_info) {
  const { unit_id, level, ...restUnitInfo } = unit_info;
  const newUnitInfo = {
    id: unit_id ? unit_id : unit_info?.id,
    level: level ? level : unit_info?.maxLevel,

    ...restUnitInfo,
  };
  if (newUnitInfo?.runes?.length) {
    const { item_id, ...restRuneInfo } = newUnitInfo.runes[0];
    return {
      ...newUnitInfo,
      runes: [
        {
          id: item_id,
          ...restRuneInfo,
        },
      ],
    };
  }
  return newUnitInfo;
}

const unitInfo_to_textual = (unit_info, isCommander = false) => {
  let name = getCardName(unit_info?.id);
  const runeId = unit_info?.runes[0]?.id;
  const rune = runeId ? RUNES[runeId]?.name?.split(' ').pop() || '' : '';
  const level = noFusionInHash[parseInt(unit_info?.id)]
    ? `|${unit_info?.level}`
    : '';

  return isCommander ? `${name}` : `${name}${level}${rune ? `|${rune}` : ''}`;
};

function unitInfo_to_base64(unit_info) {
  var baseID = parseInt(unit_info.id),
    level = parseInt(unit_info.level) - 1;
  if (noFusionInHash[baseID]) {
    var fusion = Math.floor(level / 7);
    level = level % 7;
  } else {
    fusion = Math.floor(baseID / 1e4);
    baseID %= 1e4;
  }
  var runeID = 0;
  unit_info?.runes?.length &&
    ((runeID = parseInt(unit_info.runes[0].id)), (runeID %= 5e3));
  unit_info.priority;
  var dec = baseID;
  return decimal_to_base64(
    (dec = (dec = 7 * (dec = 3 * dec + fusion) + level) * maxRuneID + runeID),
    5
  );
}

function base64_to_unitInfo(base64) {
  var dec = base64_to_decimal(base64),
    runeID = dec % maxRuneID,
    level = (dec = (dec - runeID) / maxRuneID) % 7,
    fusion = (dec = (dec - level++) / 7) % 3,
    unitID = (dec = (dec - fusion) / 3);
  noFusionInHash[unitID]
    ? (level += 7 * fusion)
    : 0 < fusion && (unitID = Number(fusion + '' + unitID));
  var unit_info = makeUnitInfo(unitID, level);
  return (
    0 < runeID &&
      unit_info.runes.push({
        id: 5e3 + runeID,
      }),
    unit_info
  );
}

function hash_encode(deck) {
  let current_hash = [],
    has_priorities = !1,
    has_indexes = !1,
    indexes = [];

  for (let k in (deck.commander &&
    current_hash.push(
      unitInfo_to_base64(unitInfo_format_to_sim(deck.commander))
    ),
  deck.deck)) {
    (current_card = deck.deck[k])?.priority && (has_priorities = !0),
      current_card?.index &&
        (indexes.push(numberToBase64(current_card.index)), (has_indexes = !0)),
      current_hash.push(
        unitInfo_to_base64(unitInfo_format_to_sim(current_card))
      );
  }

  if (has_priorities) {
    let priorities = priorityDelimiter;
    for (let k in deck.deck) {
      let current_card;
      (current_card = deck.deck[k]).priority
        ? (priorities += current_card.priority)
        : (priorities += '0');
    }
    current_hash.push(priorities);
  }

  return (
    has_indexes &&
      ((indexes = indexDelimiter + indexes.join('')),
      current_hash.push(indexes)),
    (current_hash = current_hash.join(''))
  );
}

function hash_decode(hash) {
  var unitInfo,
    indexes,
    current_deck = {
      deck: [],
    };
  0 < hash.indexOf(indexDelimiter) &&
    ((indexes = hash.substr(hash.indexOf(indexDelimiter) + 1).match(/.{1,2}/g)),
    (hash = hash.substr(0, hash.indexOf(indexDelimiter))));
  for (var unitidx = 0, i = 0; i < hash.length; i += 5) {
    var unitHash = hash.substr(i, 5);
    (unitInfo = base64_to_unitInfo(unitHash)),
      0 < unitidx &&
        indexes &&
        (unitInfo.index = base64ToNumber(indexes[unitidx - 1])),
      unitInfo &&
        (loadCard(unitInfo.id)
          ? (!current_deck.commander && is_commander(unitInfo.id)
              ? (current_deck.commander = unitInfo)
              : current_deck.deck.push(unitInfo),
            unitidx++)
          : console.log(
              "Could not decode '" + unitHash + "' (" + unitInfo.id + ')'
            ));
  }
  return (
    current_deck.commander || (current_deck.commander = elariaCaptain),
    current_deck
  );
}

const upgradeCard = (card, level = card?.maxLevel) => {
  let outputCard = { ...card };

  if (card?.upgrades && Object.keys(card?.upgrades)?.length) {
    for (let i = 2; i <= level; i++) {
      const { skill = [], ...rest } = card?.upgrades[i];
      outputCard = { ...outputCard, ...rest, ...(skill?.length && { skill }) };
    }
  }

  return outputCard;
};

const getRune = function (rune_id) {
  if (!window.RUNES) {
    console.warn('RUNES are not loaded');
    return { stat_boost: {} };
  }
  return window.RUNES[rune_id] || { stat_boost: {} };
};

const applyRunesToCard = (card, runes, runeMult = 1) => {
  if (!window.RUNES) {
    console.warn('RUNES are not loaded');
    return card;
  }

  let modifiedCard = { ...card };

  if (!runes || runes.length === 0) {
    return modifiedCard;
  }

  modifiedCard = applyRunesToStats(modifiedCard, runes);
  modifiedCard.skill = applyRunesToSkills(modifiedCard.skill, runes, runeMult);

  return modifiedCard;
};

const applyRunesToStats = (card, runes) => {
  if (!window.RUNES) {
    console.warn('RUNES are not loaded');
    return card;
  }

  let modifiedCard = { ...card };

  for (let rune of runes) {
    const runeData = getRune(rune.id);

    if (!runeData.stat_boost) continue;

    for (let key in runeData.stat_boost) {
      let boost = runeData.stat_boost[key];

      if (key === 'skill') continue;

      let bonusValue =
        typeof boost === 'number'
          ? boost
          : Math.max(
              Math.ceil(modifiedCard[key] * (boost.mult || 1)),
              boost.min_bonus || 1
            );

      modifiedCard[key] = (modifiedCard[key] || 0) + parseInt(bonusValue);
    }
  }

  return modifiedCard;
};

const applyRunesToSkills = (skills, runes, runeMult = 1) => {
  if (!window.RUNES) {
    console.warn('RUNES are not loaded');
    return skills;
  }

  if (!skills) return [];

  let modifiedSkills = [...skills];

  for (let rune of runes) {
    const runeData = getRune(rune.id);

    if (!runeData.stat_boost) continue;

    for (let key in runeData.stat_boost) {
      let boost = runeData.stat_boost[key];

      if (key !== 'skill') continue;

      let skillID = boost.id;
      let amount = boost.x;
      let mult = boost.mult;

      for (let i = 0; i < modifiedSkills.length; i++) {
        let skill = modifiedSkills[i];

        if (skill.id === skillID && (skill.all || 0) === (boost.all || 0)) {
          skill = { ...skill };

          if (!amount && mult) {
            amount = Math.ceil(skill.x * mult);
          }

          if (boost.min_bonus) {
            amount = Math.max(amount, boost.min_bonus);
          }

          if (amount) {
            skill.x += parseInt(amount) * runeMult;
          }

          if (boost.c) {
            skill.c -= Math.min(skill.c, parseInt(boost.c) * runeMult);
          }

          skill.boosted = true;
          modifiedSkills[i] = skill;
          break;
        }
      }
    }
  }

  return modifiedSkills;
};

function addRunes(card, runes) {
  card.runes || (card.runes = []);
  for (var i = 0, len = runes.length; i < len; i++) {
    var runeID = runes[i].id,
      statBoost = getRune(runeID).stat_boost;
    for (var key in (card.runes.push({
      id: runeID,
      stat_boost: statBoost,
    }),
    statBoost)) {
      var boost = statBoost[key];
      'skill' == key ||
        (isNaN(boost) &&
          (boost = Math.max(
            Math.ceil(card[key] * boost.mult),
            boost.min_bonus || 1
          )),
        (card[key] += parseInt(boost)));
    }
  }
}

function addRunesToSkills(skills, runes, runeMult) {
  if (runes)
    for (var i = 0, len = runes.length; i < len; i++) {
      var runeID = runes[i].id,
        statBoost = getRune(runeID).stat_boost;
      for (var key in statBoost) {
        var boost = statBoost[key];
        if ('skill' == key)
          for (
            var skillID = boost.id, amount = boost.x, mult = boost.mult, s = 0;
            s < skills.length;
            s++
          ) {
            var skill = skills[s];
            if (skill.id == skillID && (skill.all || 0) == (boost.all || 0)) {
              (skill = copy_skill(skill)),
                !amount && mult && (amount = Math.ceil(skill.x * mult)),
                boost.min_bonus && (amount = Math.max(amount, boost.min_bonus)),
                amount && (skill.x += parseInt(amount) * runeMult),
                boost.c &&
                  (skill.c -= Math.min(skill.c, parseInt(boost.c) * runeMult)),
                (skill.boosted = !0),
                (skills[s] = skill);
              break;
            }
          }
      }
    }
}

function copy_skill(original_skill) {
  var new_skill = {};
  return (
    (new_skill.id = original_skill.id),
    (new_skill.x = original_skill.x || 0),
    (new_skill.mult = original_skill.mult),
    (new_skill.on_delay_mult = original_skill.on_delay_mult),
    (new_skill.all = original_skill.all),
    (new_skill.y = original_skill.y),
    (new_skill.z = original_skill.z),
    (new_skill.c = original_skill.c),
    (new_skill.s = original_skill.s),
    (new_skill.ignore_nullify = original_skill.ignore_nullify),
    (new_skill.card = original_skill.card),
    (new_skill.level = original_skill.level),
    new_skill
  );
}

function copyToClipboard(BtnTag, CopiedContent) {
  navigator.clipboard.writeText(CopiedContent).then(() => {
    const originalHTML = BtnTag.innerHTML;
    BtnTag.innerHTML = `<span id="success-icon">
            <svg
              class="w-4 h-4 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 16 12"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M1 5.917 5.724 10.5 15 1.5"
              />
            </svg>
          </span>`;

    setTimeout(() => {
      BtnTag.innerHTML = originalHTML;
    }, 1000);
  });
}

function sortDeck(deck) {
  return deck.deck.sort(function (unitA, unitB) {
    var compare,
      cardA = getCardByID(unitA),
      cardB = getCardByID(unitB);
    return (compare = cardA.rarity - cardB.rarity)
      ? compare
      : (compare = cardA.type - cardB.type)
      ? compare
      : (compare = compareByID(unitA, unitB))
      ? compare
      : (compare = unitA.level - unitB.level)
      ? compare
      : (compare =
          (unitA.runes.length ? unitA.runes[0].id : 0) -
          (unitB.runes.length ? unitB.runes[0].id : 0));
  });
}

function getCardByID(unit, skillModifiers, skillMult, isToken) {
  var current_card = loadCard(unit.id);
  if (current_card) {
    current_card.skill || (current_card.skill = []);
    var card = makeUnit(
      current_card,
      unit.level,
      unit.runes,
      skillModifiers,
      skillMult,
      isToken
    );
    return unit.priority && (card.priority = unit.priority), card;
  }
  return (
    console.log(unit.id + ' not found'),
    ((current_card = {}).id = unit.id),
    (current_card.level = unit.level),
    (current_card.name = void 0),
    (current_card.health = void 0),
    (current_card.skill = []),
    current_card
  );
}

var compareByID = function (unitA, unitB) {
  var comparison,
    unitIDA = unitA.id,
    unitIDB = unitB.id;
  return 0 != (comparison = (unitIDA % 1e4) - (unitIDB % 1e4))
    ? comparison
    : 0 != (comparison = unitIDA - unitIDB)
    ? comparison
    : 0 != (comparison = unitA.level - unitB.level)
    ? comparison
    : sortByRunes(unitA, unitB);
};

function applyDefaultStatuses(card) {
  for (var status in ((card.health -= card.invigorated),
  card.removeImbue(),
  (card.enhanced = {}),
  defaultStatusValues))
    card[status] = defaultStatusValues[status];
}

var makeUnit = (function () {
  function getStatBeforeRunes(card, statBase) {
    return getCardByID({
      id: card.id,
      level: card.level,
    })[statBase];
  }

  function scaleSkills(new_card, skillList, mult) {
    for (var key in skillList) {
      var skill = skillList[key];
      skill.x &&
        (((skill = copy_skill(skill)).x += Math.ceil(skill.x * mult)),
        (skill.boosted = !0),
        (skillList[key] = skill),
        new_card.highlighted.push(skill.id));
    }
  }
  for (var id in ((CardPrototype = {
    p: null,
    health_left: 0,
    timer: 0,
    key: void 0,
    isCommander: function () {
      return '1' == this.card_type;
    },
    isAssault: function () {
      return '2' == this.card_type;
    },
    isTower: function () {
      return !1;
    },
    isTrap: function () {
      return '3' == this.card_type;
    },
    isAlive: function () {
      return 0 < this.health_left;
    },
    isDamaged: function () {
      return this.health_left < this.health;
    },
    isActive: function () {
      return 0 == this.timer;
    },
    isActiveNextTurn: function () {
      return this.timer <= 1;
    },
    isInactive: function () {
      return 1 <= this.timer;
    },
    isUnjammed: function () {
      return !this.jammed;
    },
    isUnsilenced: function () {
      return !this.silenced;
    },
    imbue: function (skill) {
      this.imbued || (this.imbued = {});
      var imbueSkillsKey,
        imbued = this.imbued,
        skillID = skill.id;
      switch (SKILL_DATA[skillID].type) {
        case 'toggle':
          return (this[skillID] = !0), void (this.imbued[skillID] = 1);
        case 'passive':
          return (
            (this[skillID] += parseInt(skill.x)),
            void (this.imbued[skillID] = (this.imbued[skillID] || 0) + skill.x)
          );
        case 'flurry':
          return void (
            this.flurry ||
            ((this.flurry = skill),
            (this.flurry.countdown = 0),
            (this.imbued.flurry = !0))
          );
        case 'onDeath':
          imbueSkillsKey = 'onDeathSkills';
          break;
        case 'earlyActivation':
          imbueSkillsKey = 'earlyActivationSkills';
          break;
        case 'activation':
        default:
          imbueSkillsKey = 'skill';
      }
      if (void 0 === imbued[imbueSkillsKey]) {
        var original = this[imbueSkillsKey];
        (imbued[imbueSkillsKey] = original.length),
          (this[imbueSkillsKey] = original.slice());
      }
      this[imbueSkillsKey].push(skill);
    },
    scorch: function (amount) {
      var scorched = this.scorched;
      scorched
        ? ((scorched.amount += amount), (scorched.timer = 2))
        : (this.scorched = {
            amount: amount,
            timer: 2,
          });
    },
    removeImbue: function () {
      var imbue = this.imbued;
      if (imbue) {
        for (var key in imbue) {
          var imbuement = imbue[key];
          'skill' === key ||
          'earlyActivationSkills' === key ||
          'onDeathSkills' === key
            ? (this[key] = this[key].slice(0, imbuement))
            : (this[key] -= imbuement);
        }
        this.imbued = 0;
      }
    },
    hasSkill: function (s, all) {
      var target_skills;
      switch (SKILL_DATA[s].type) {
        case 'toggle':
        case 'passive':
        case 'flurry':
          return this[s];
        case 'onDeath':
          target_skills = this.onDeathSkills;
          break;
        case 'earlyActivation':
          target_skills = this.earlyActivationSkills;
          break;
        case 'activation':
        default:
          target_skills = this.skill;
      }
      for (var key in target_skills) {
        var skill = target_skills[key];
        if (skill.id === s && (void 0 === all || (skill.all || 0) == all))
          return !0;
      }
      return !1;
    },
    hasAttack: function () {
      return 0 < this.adjustedAttack();
    },
    attackPlusBuffs: function () {
      return (
        this.attack +
        this.attack_rally +
        this.attack_berserk +
        this.attack_valor
      );
    },
    adjustedAttack: function () {
      return (
        this.attack +
        this.attack_rally +
        this.attack_berserk +
        this.attack_valor -
        this.attack_weaken -
        this.attack_corroded
      );
    },
    permanentAttack: function () {
      return this.attack + this.attack_berserk + this.attack_valor;
    },
    hasNegativeStatus: function () {
      return (
        this.poisoned ||
        this.enfeebled ||
        this.scorched ||
        this.jammed ||
        this.envenomed ||
        this.attack_weaken ||
        this.silenced ||
        this.confused
      );
    },
    isInFaction: function (faction) {
      if (void 0 === faction) return 1;
      var factions = faction.split(',');
      if (factions.length <= 1)
        return this.type == faction
          ? 1
          : 0 <= this.sub_type.indexOf(faction.toString())
          ? 1
          : 0;
      for (var i = 0; i < factions.length; i++)
        if (!this.isInFaction(factions[i])) return 0;
      return 1;
    },
    isTargetRarity: function (rarity) {
      return void 0 === rarity || this.rarity === Number(rarity);
    },
    isTargetDelay: function (delay) {
      return void 0 === delay || 0 <= delay.indexOf(this.cost);
    },
    resetTimers: function () {
      for (var i = 0, len = this.skillTimers.length; i < len; i++)
        this.skillTimers[i].countdown = 0;
    },
    addRunes: function (runes) {
      addRunes(this, runes);
    },
  }),
  SKILL_DATA)) {
    var type = SKILL_DATA[id].type;
    'passive' === type
      ? (CardPrototype[id] = 0)
      : 'toggle' === type && (CardPrototype[id] = !1);
  }
  return (
    applyDefaultStatuses(CardPrototype),
    function (
      original_card,
      unit_level,
      runes,
      skillModifiers,
      skillMult,
      isToken
    ) {
      unit_level = unit_level || 1;
      var card = Object.create(CardPrototype);
      (card.id = original_card.id),
        (card.name = original_card.name),
        (card.attack = original_card.attack),
        (card.health = original_card.health),
        (card.maxLevel = original_card.maxLevel),
        (card.level = unit_level > card.maxLevel ? card.maxLevel : unit_level),
        (card.cost = original_card.cost || 0),
        (card.rarity = original_card.rarity),
        (card.card_type = original_card.card_type),
        (card.type = original_card.type),
        (card.sub_type = original_card.sub_type || []),
        (card.set = original_card.set);
      var upgrade,
        original_skills = original_card.skill;
      if (1 < card.level)
        for (var key in original_card.upgrades)
          if (
            (void 0 !== (upgrade = original_card.upgrades[key]).cost &&
              (card.cost = upgrade.cost),
            void 0 !== upgrade.health && (card.health = upgrade.health),
            void 0 !== upgrade.attack && (card.attack = upgrade.attack),
            void 0 !== upgrade.desc && (card.desc = upgrade.desc),
            0 < upgrade.skill.length && (original_skills = upgrade.skill),
            key == card.level)
          )
            break;
      if (
        (isToken &&
          isToken.newStats &&
          ((card.health = isToken.newStats.health),
          (card.attack = isToken.newStats.attack)),
        (card.base_health = card.health),
        (original_skills = original_skills.slice()),
        skillModifiers &&
          skillModifiers.length &&
          (function (new_card, original_skills, skillModifiers, isToken) {
            new_card.highlighted = [];
            for (var i = 0; i < skillModifiers.length; i++) {
              var skillModifier = skillModifiers[i];
              if ('statChange' === skillModifier.modifierType && !isToken)
                for (var j = 0; j < skillModifier.effects.length; j++) {
                  var statChange = skillModifier.effects[j];
                  new_card.isInFaction(statChange.y) &&
                    new_card.isTargetRarity(statChange.rarity) &&
                    new_card.isTargetDelay(statChange.delay) &&
                    Object.keys(statChange).forEach(function (stat) {
                      new_card[stat] = statChange[stat];
                    });
                }
            }
          })(card, 0, skillModifiers, isToken),
        runes)
      ) {
        card.addRunes(runes);
        var runeMult = 1;
        skillModifiers &&
          skillModifiers.forEach(function (skillModifier) {
            'runeMultiplier' === skillModifier.modifierType &&
              skillModifier.effects.forEach(function (effect) {
                card.isInFaction(effect.y) &&
                  (runeMult = parseInt(effect.mult));
              });
          }),
          addRunesToSkills(original_skills, runes, runeMult);
      } else card.runes = [];
      return (
        skillModifiers &&
          skillModifiers.length &&
          (function (new_card, original_skills, skillModifiers, isToken) {
            new_card.highlighted = [];
            for (var i = 0; i < skillModifiers.length; i++) {
              var skillModifier = skillModifiers[i];
              if ('evolve_skill' === skillModifier.modifierType)
                for (var j = 0; j < skillModifier.effects.length; j++) {
                  var evolution = skillModifier.effects[j];
                  for (var key in original_skills) {
                    var skill = original_skills[key];
                    skill.id === evolution.id &&
                      skill.all == evolution.all &&
                      new_card.isTargetRarity(evolution.rarity) &&
                      new_card.isTargetDelay(evolution.delay) &&
                      (((skill = copy_skill(skill)).id = evolution.s),
                      (skill.boosted = !0),
                      (original_skills[key] = skill),
                      new_card.highlighted.push(skill.id));
                  }
                }
              else if ('add_skill' === skillModifier.modifierType)
                for (j = 0; j < skillModifier.effects.length; j++) {
                  var addedSkill = skillModifier.effects[j];
                  if (
                    new_card.isInFaction(addedSkill.y) &&
                    new_card.isTargetRarity(addedSkill.rarity) &&
                    new_card.isTargetDelay(addedSkill.delay)
                  ) {
                    var new_skill = {};
                    if (
                      ((new_skill.id = addedSkill.id),
                      (new_skill.x = addedSkill.x || 0),
                      addedSkill.mult)
                    )
                      if (addedSkill.base) {
                        var base = getStatBeforeRunes(
                          new_card,
                          addedSkill.base
                        );
                        (base = isToken ? new_card[addedSkill.base] : base),
                          (new_skill.x += Math.ceil(addedSkill.mult * base));
                      } else new_skill.mult = addedSkill.mult;
                    if (
                      ((new_skill.z = addedSkill.z),
                      (new_skill.c = addedSkill.c),
                      (new_skill.s = addedSkill.s),
                      (new_skill.all = addedSkill.all),
                      addedSkill.card && (new_skill.card = addedSkill.card),
                      addedSkill.level && (new_skill.level = addedSkill.level),
                      (new_skill.boosted = !0),
                      addedSkill.mult && addedSkill.base && 0 == new_skill.x)
                    )
                      continue;
                    original_skills.push(new_skill),
                      new_card.highlighted.push(new_skill.id);
                  }
                }
              else if (
                'scale_attributes' !== skillModifier.modifierType ||
                isToken
              ) {
                if ('scale_stat' === skillModifier.modifierType && !isToken)
                  for (j = 0; j < skillModifier.effects.length; j++) {
                    scaling = skillModifier.effects[j];
                    new_card.isInFaction(scaling.y) &&
                      new_card.isTargetRarity(
                        scaling.rarity && new_card.isTargetDelay(scaling.delay)
                      ) &&
                      ((new_card[skillModifier.scaledStat] += Math.ceil(
                        getStatBeforeRunes(new_card, scaling.base) *
                          scaling.mult
                      )),
                      new_card.highlighted.push(skillModifier.scaledStat));
                  }
              } else
                for (var j = 0; j < skillModifier.effects.length; j++) {
                  var scaling = skillModifier.effects[j];
                  if (
                    new_card.isInFaction(scaling.y) &&
                    new_card.isTargetRarity(scaling.rarity) &&
                    new_card.isTargetDelay(scaling.delay)
                  ) {
                    var mult = scaling.mult,
                      plusAttack = Math.ceil(new_card.attack * mult);
                    (new_card.attack += plusAttack),
                      new_card.highlighted.push('attack');
                    var plusHealth = Math.ceil(new_card.health * mult);
                    (new_card.health += plusHealth),
                      new_card.highlighted.push('health'),
                      scaleSkills(new_card, original_skills, mult);
                  }
                }
            }
          })(card, original_skills, skillModifiers, isToken),
        skillMult && scaleSkills(card, original_skills, skillMult),
        copySkills(card, original_skills),
        card
      );
    }
  );
})();

function copySkills(new_card, original_skills, mult) {
  (new_card.skill = []),
    (new_card.earlyActivationSkills = []),
    (new_card.onDeathSkills = []);
  var skillTimers = [],
    reusable = !0;
  for (var key in original_skills) {
    var newSkill = original_skills[key],
      copySkill = copy_skill(newSkill);
    newSkill.c
      ? (setSkill(new_card, copySkill),
        skillTimers.push(copySkill),
        (reusable = !1))
      : (mult && (copySkill.x = Math.ceil(copySkill.x * mult)),
        setSkill(new_card, copySkill));
  }
  (new_card.reusableSkills = reusable), (new_card.skillTimers = skillTimers);
}

function setSkill(new_card, skill) {
  var skillID = skill.id;
  switch (SKILL_DATA[skillID].type) {
    case 'toggle':
      return void (new_card[skillID] = !0);
    case 'passive':
      new_card[skill.id] = (0 | new_card[skill.id]) + skill.x;
      break;
    case 'flurry':
      new_card[skill.id] = skill;
      break;
    case 'onDeath':
      new_card.onDeathSkills.push(skill);
      break;
    case 'earlyActivation':
      new_card.earlyActivationSkills.push(skill);
      break;
    case 'activation':
    default:
      new_card.skill.push(skill);
  }
}

function sortByRunes(unitA, unitB) {
  var comparison = unitA.runes.length - unitB.runes.length;
  return 0 != comparison
    ? comparison
    : unitA.runes.length
    ? unitA.runes[0].id - unitB.runes[0].id
    : 0;
}

function copy_skill(original_skill) {
  var new_skill = {};
  return (
    (new_skill.id = original_skill.id),
    (new_skill.x = original_skill.x || 0),
    (new_skill.mult = original_skill.mult),
    (new_skill.on_delay_mult = original_skill.on_delay_mult),
    (new_skill.all = original_skill.all),
    (new_skill.y = original_skill.y),
    (new_skill.z = original_skill.z),
    (new_skill.c = original_skill.c),
    (new_skill.s = original_skill.s),
    (new_skill.ignore_nullify = original_skill.ignore_nullify),
    (new_skill.card = original_skill.card),
    (new_skill.level = original_skill.level),
    new_skill
  );
}

const sortHash = (hash) => {
  const decodedDeck = hash_decode(hash);
  const sortedDeck = sortDeck(decodedDeck);
  const res = hash_encode({
    commander: decodedDeck?.commander,
    deck: sortedDeck,
  });
  return res;
};

function factorial(num) {
  if (num < 2) return 1;
  return num * factorial(num - 1);
}

function combinationCount(n, k) {
  if (k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function generateDeckVariations(partialDeckHash, cardPool, cardsToAdd) {
  const substrings = cardPool.match(/.{1,5}/g) || [];
  const totalSubstrings = substrings.length;

  if (totalSubstrings < cardsToAdd) {
    console.log('Error: Insufficient substrings for combinations.');
    return [];
  }

  const estimatedCombinations = combinationCount(totalSubstrings, cardsToAdd);
  if (estimatedCombinations > 2000) {
    console.log(
      `Error: Too many varations — (≈${estimatedCombinations.toFixed(
        0
      )}), the script has been stopped.`
    );
    return [];
  }

  function getCombinations(arr, length) {
    if (length === 1) return arr.map((el) => [el]);

    let result = [];
    for (let i = 0; i <= arr.length - length; i++) {
      let head = arr[i];
      let tailCombinations = getCombinations(arr.slice(i + 1), length - 1);
      tailCombinations.forEach((tail) => result.push([head, ...tail]));
    }
    return result;
  }

  const combinations = getCombinations(substrings, cardsToAdd);
  const uniqueCombinations = new Set(
    combinations.map((combo) => combo.sort().join(''))
  );

  const result = [...uniqueCombinations].map((combo) =>
    sortHash(partialDeckHash + combo)
  );

  //console.log(result.join('\n'));
  //return result;
  return result.join('\n');
}

const partialInputHTML = document.getElementById('partialInput');
const poolInputHTML = document.getElementById('poolInput');
const numberInputHTML = document.getElementById('numberInput');
const resultsInput = document.getElementById('resultsInput');

const clearButtonHTML = document.getElementById('clearButton');
const runButtonHTML = document.getElementById('runButton');

runButtonHTML.addEventListener('click', function () {
  const partialDeck = partialInputHTML.value.trim();
  const inventory = poolInputHTML.value.trim();
  const addAmount = Number(numberInputHTML.value.trim());

  if (!partialDeck || !inventory || !addAmount) {
    resultsInput.textContent =
      'Please enter all data (deckHash, cardPoolHash, # cards to add)';
    return;
  }
  try {
    const result = generateDeckVariations(partialDeck, inventory, addAmount);
    resultsInput.textContent = result;
  } catch (error) {
    resultsInput.textContent = 'Error: ' + error.message;
  }
});

clearButtonHTML.addEventListener('click', () => {
  partialInputHTML.value = '';
  poolInputHTML.value = '';
  numberInputHTML.value = '';
  resultsInput.textContent = '';
});

/* copyPlayerBtnHTML.addEventListener('click', () => {
  copyToClipboard(copyPlayerBtnHTML, playerNameHTML.value);
}); */
