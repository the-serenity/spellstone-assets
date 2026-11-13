const MIN_PARTIAL_CARDS = 8;

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
            ((timeout = null), func.apply(context, args));
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
  return (runes && (unit.runes = runes), unit);
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
    ((base64 += base64chars[part]), (dec = (dec - part) / 64));
  }
  return base64;
}

function base64_to_decimal(base64) {
  for (var dec = 0, i = base64.length - 1; 0 <= i; i--) {
    ((dec *= 64), (dec += base64chars.indexOf(base64[i])));
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
    base64chars.indexOf(base64[0]) + 64 * base64chars.indexOf(base64[1]),
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
    5,
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
      unitInfo_to_base64(unitInfo_format_to_sim(deck.commander)),
    ),
  deck.deck)) {
    ((current_card = deck.deck[k])?.priority && (has_priorities = !0),
      current_card?.index &&
        (indexes.push(numberToBase64(current_card.index)), (has_indexes = !0)),
      current_hash.push(
        unitInfo_to_base64(unitInfo_format_to_sim(current_card)),
      ));
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
    ((unitInfo = base64_to_unitInfo(unitHash)),
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
              "Could not decode '" + unitHash + "' (" + unitInfo.id + ')',
            )));
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
              boost.min_bonus || 1,
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
            boost.min_bonus || 1,
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
              ((skill = copy_skill(skill)),
                !amount && mult && (amount = Math.ceil(skill.x * mult)),
                boost.min_bonus && (amount = Math.max(amount, boost.min_bonus)),
                amount && (skill.x += parseInt(amount) * runeMult),
                boost.c &&
                  (skill.c -= Math.min(skill.c, parseInt(boost.c) * runeMult)),
                (skill.boosted = !0),
                (skills[s] = skill));
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

function copyToClipboard(CopiedContent) {
  navigator.clipboard.writeText(CopiedContent);
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
      isToken,
    );
    return (unit.priority && (card.priority = unit.priority), card);
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
          return ((this[skillID] = !0), void (this.imbued[skillID] = 1));
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
        ((imbued[imbueSkillsKey] = original.length),
          (this[imbueSkillsKey] = original.slice()));
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
      isToken,
    ) {
      unit_level = unit_level || 1;
      var card = Object.create(CardPrototype);
      ((card.id = original_card.id),
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
        (card.set = original_card.set));
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
        (skillModifiers &&
          skillModifiers.forEach(function (skillModifier) {
            'runeMultiplier' === skillModifier.modifierType &&
              skillModifier.effects.forEach(function (effect) {
                card.isInFaction(effect.y) &&
                  (runeMult = parseInt(effect.mult));
              });
          }),
          addRunesToSkills(original_skills, runes, runeMult));
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
                          addedSkill.base,
                        );
                        ((base = isToken ? new_card[addedSkill.base] : base),
                          (new_skill.x += Math.ceil(addedSkill.mult * base)));
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
                    (original_skills.push(new_skill),
                      new_card.highlighted.push(new_skill.id));
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
                        scaling.rarity && new_card.isTargetDelay(scaling.delay),
                      ) &&
                      ((new_card[skillModifier.scaledStat] += Math.ceil(
                        getStatBeforeRunes(new_card, scaling.base) *
                          scaling.mult,
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
                    ((new_card.attack += plusAttack),
                      new_card.highlighted.push('attack'));
                    var plusHealth = Math.ceil(new_card.health * mult);
                    ((new_card.health += plusHealth),
                      new_card.highlighted.push('health'),
                      scaleSkills(new_card, original_skills, mult));
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
  ((new_card.skill = []),
    (new_card.earlyActivationSkills = []),
    (new_card.onDeathSkills = []));
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
  ((new_card.reusableSkills = reusable), (new_card.skillTimers = skillTimers));
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

// ============================================
// LIST EXTRACTOR
// ============================================

// Mystic cards and their output levels
const MYSTIC_LEVELS = {
  2017: 7,
  2016: 7,
  2018: 7,
  2039: 7,
  2074: 7,
  2094: 7,
  2158: 7,

  4003: 10,
  4506: 10,
  4507: 10,
  4508: 10,
};

// Sets that allow only one copy of each card ID
const UNIQUE_SETS = new Set(['5000', '5200', '5100']);

// Sets where the output count equals the maximum
// number of copies found in any individual deck
const REPEAT_SETS = new Set(['1000', '7000', '2000', '2100', '3000']);

// Fixed output levels
const UNIQUE_SET_LEVEL = 10;
const REPEAT_SET_LEVEL = 6;

// Parse input into individual deck hashes
function parseBatchLines(input, fieldName) {
  const lines = input.split(/\r\n|\n|\r/).map((line) => line.trim());

  while (lines.length && !lines[0]) {
    lines.shift();
  }

  while (lines.length && !lines[lines.length - 1]) {
    lines.pop();
  }

  if (!lines.length) {
    throw new Error(`${fieldName}: no data provided.`);
  }

  if (lines.some((line) => !line)) {
    throw new Error(`${fieldName}: empty line found inside the batch.`);
  }

  // if (lines.length > 50) {
  //  throw new Error(`${fieldName}: maximum 50 entries allowed.`);
  //}

  return lines;
}

// Build the aggregate candidate pool
function generateListExtractorResults(decksInput) {
  const decks = parseBatchLines(decksInput, 'Deck hashes');

  // IDs of cards that must appear only once
  const uniqueCardIds = new Set();

  // Maximum number of copies of repeatable cards
  // found in any single deck
  const maxRepeatCounts = new Map();

  // Preserve the order in which card IDs first appeared
  const cardOrder = [];

  // Output level for every accepted card ID
  const outputLevels = new Map();

  // Process every deck
  for (let deckIndex = 0; deckIndex < decks.length; deckIndex++) {
    const decodedDeck = hash_decode(decks[deckIndex]);

    // Count repeatable cards within the current deck
    const currentDeckCounts = new Map();

    for (const card of decodedDeck.deck) {
      const id = Number(card.id);

      // Mystic cards have their own rules
      if (Object.prototype.hasOwnProperty.call(MYSTIC_LEVELS, id)) {
        if (!uniqueCardIds.has(id)) {
          uniqueCardIds.add(id);
          cardOrder.push(id);
          outputLevels.set(id, MYSTIC_LEVELS[id]);
        }

        continue;
      }

      const cardData = CARDS[id];

      // Missing card data
      if (!cardData) {
        console.warn(
          `[List Extractor] Unknown card ID: ${id}. ` +
            `Card data not found in CARDS.`,
        );

        continue;
      }

      const cardSet = String(cardData.set);

      // Cards from unique sets
      if (UNIQUE_SETS.has(cardSet)) {
        if (!uniqueCardIds.has(id)) {
          uniqueCardIds.add(id);
          cardOrder.push(id);
          outputLevels.set(id, UNIQUE_SET_LEVEL);
        }

        continue;
      }

      // Cards from repeatable sets
      if (REPEAT_SETS.has(cardSet)) {
        currentDeckCounts.set(id, (currentDeckCounts.get(id) || 0) + 1);

        if (!outputLevels.has(id)) {
          cardOrder.push(id);
          outputLevels.set(id, REPEAT_SET_LEVEL);
        }

        continue;
      }

      // Unexpected card set
      console.warn(
        `[List Extractor] Unexpected card category. ` +
          `Card ID: ${id}, Set: ${cardSet}. ` +
          `Card will be ignored.`,
      );
    }

    // Update maximum counts after processing this deck
    for (const [id, count] of currentDeckCounts) {
      const previousMax = maxRepeatCounts.get(id) || 0;

      if (count > previousMax) {
        maxRepeatCounts.set(id, count);
      }
    }
  }

  // Build the resulting card list
  const outputCards = [];

  for (const id of cardOrder) {
    const level = outputLevels.get(id);

    // Unique cards: exactly one copy
    if (uniqueCardIds.has(id)) {
      outputCards.push(makeUnitInfo(id, level));
      continue;
    }

    // Repeatable cards: maximum count from any one deck
    const count = maxRepeatCounts.get(id) || 0;

    for (let i = 0; i < count; i++) {
      outputCards.push(makeUnitInfo(id, level));
    }
  }

  // Encode the cards without a commander.
  // All output cards have fixed levels and no runes.
  return sortHash(
    hash_encode({
      deck: outputCards,
    }),
  );
}

// ============================================
// DOM HANDLERS
// ============================================

const partialInputHTML = document.getElementById('partialInput');
const resultsInput = document.getElementById('resultsInput');

const clearButtonHTML = document.getElementById('clearButton');
const copyHashBtnHTML = document.getElementById('copyCandidates');
const runButtonHTML = document.getElementById('runButton');
const replicateMinLevel = document.getElementById('replicateMinLevel');

// Get cards
runButtonHTML.addEventListener('click', function () {
  const decksInput = partialInputHTML.value;

  resultsInput.value = '';

  if (!decksInput.trim()) {
    resultsInput.value = 'Please enter deck hashes.';
    return;
  }

  try {
    resultsInput.value = generateListExtractorResults(decksInput);
  } catch (error) {
    console.error('[List Extractor]', error);
    resultsInput.value = 'Error: ' + error.message;
  }
});

// Clear all fields
clearButtonHTML.addEventListener('click', () => {
  partialInputHTML.value = '';
  resultsInput.value = '';
});

// Copy results
copyHashBtnHTML.addEventListener('click', () => {
  if (resultsInput.value) {
    copyToClipboard(resultsInput.value);
  }
});

// ============================================
// CANDIDATES REPLICATOR
// ============================================

function getCardName(id) {
  return CARDS[id]?.name || CARDS[id]?.card_name || `Unknown card (ID: ${id})`;
}

function replicateCandidates(candidatesHash, inventoryHash, minLevel = 5) {
  const decodedCandidates = hash_decode(candidatesHash);
  const decodedInventory = hash_decode(inventoryHash);

  // Each inventory card can only be used once
  const availableInventory = [...decodedInventory.deck];

  const replicatedCards = [];

  const takenMessages = [];
  const skippedMessages = [];

  for (const candidate of decodedCandidates.deck) {
    const candidateId = Number(candidate.id);

    // Find all available inventory copies with the same ID
    const matchingIndexes = [];

    availableInventory.forEach((inventoryCard, index) => {
      if (Number(inventoryCard.id) === candidateId) {
        matchingIndexes.push(index);
      }
    });

    // Find the first copy that meets the minimum level
    const inventoryIndex = matchingIndexes.find((index) => {
      return Number(availableInventory[index].level) >= minLevel;
    });

    if (inventoryIndex !== undefined) {
      const inventoryCard = availableInventory[inventoryIndex];

      // Preserve the actual inventory card, including its level and runes
      replicatedCards.push(inventoryCard);

      // Consume this inventory copy
      availableInventory.splice(inventoryIndex, 1);

      takenMessages.push(
        `+ ${getCardName(candidateId)} (ID: ${candidateId}, Level: ${inventoryCard.level})`,
      );
    } else {
      const cardName = getCardName(candidateId);

      if (matchingIndexes.length > 0) {
        const inventoryLevels = matchingIndexes.map((index) => {
          return availableInventory[index].level;
        });

        skippedMessages.push(
          `- ${cardName} (ID: ${candidateId}) — ` +
            `level too low. Inventory levels: ${inventoryLevels.join(', ')}. ` +
            `Required: ${minLevel}+`,
        );
      } else {
        skippedMessages.push(
          `- ${cardName} (ID: ${candidateId}) — not available in inventory`,
        );
      }
    }
  }

  const resultHash = hash_encode({
    deck: replicatedCards,
  });

  const messages = [
    `Candidates: ${decodedCandidates.deck.length}`,
    `Inventory cards: ${decodedInventory.deck.length}`,
    `Minimum level: ${minLevel}`,
    `Successfully replicated: ${replicatedCards.length}`,
    `Skipped: ${skippedMessages.length}`,
    '',
    '--- TAKEN ---',
    ...(takenMessages.length ? takenMessages : ['No cards taken.']),
    '',
    '--- SKIPPED ---',
    ...(skippedMessages.length ? skippedMessages : ['No cards skipped.']),
  ];

  return {
    hash: resultHash,
    messages: messages.join('\n'),
    taken: replicatedCards.length,
    skipped: skippedMessages.length,
  };
}

// ============================================
// CANDIDATES REPLICATOR DOM HANDLERS
// ============================================

const replicateCandidatesInput = document.getElementById(
  'replicateCandidatesInput',
);

const replicateInventoryInput = document.getElementById(
  'replicateInventoryInput',
);

const replicateResultsInput = document.getElementById('replicateResultsInput');

const replicateMessages = document.getElementById('replicateMessages');

const replicateButton = document.getElementById('replicateButton');

const clearReplicatorButton = document.getElementById('clearReplicatorButton');

const copyReplicatorResults = document.getElementById('copyReplicatorResults');

// Replicate candidates
replicateButton.addEventListener('click', function () {
  const candidatesHash = replicateCandidatesInput.value.trim();
  const inventoryHash = replicateInventoryInput.value.trim();

  replicateResultsInput.value = '';
  replicateMessages.value = '';

  if (!candidatesHash || !inventoryHash) {
    replicateMessages.value =
      'Please enter both Candidates and Inventory hashes.';
    return;
  }

  const minLevel = Number(replicateMinLevel.value);

  if (!Number.isInteger(minLevel) || minLevel < 1 || minLevel > 6) {
    replicateMessages.value =
      'Error: Min level must be an integer between 1 and 6.';
    return;
  }

  try {
    const result = replicateCandidates(candidatesHash, inventoryHash, minLevel);

    replicateResultsInput.value = result.hash;
    replicateMessages.value = result.messages;

    console.log('[Candidates Replicator]', result);
  } catch (error) {
    console.error('[Candidates Replicator]', error);

    replicateMessages.value = 'Error: ' + error.message;
  }
});

// Clear all Replicator fields
clearReplicatorButton.addEventListener('click', () => {
  replicateCandidatesInput.value = '';
  replicateInventoryInput.value = '';
  replicateResultsInput.value = '';
  replicateMessages.value = '';
});

// Copy replicated hash
copyReplicatorResults.addEventListener('click', () => {
  if (replicateResultsInput.value) {
    copyToClipboard(replicateResultsInput.value);
  }
});

// ============================================
// DECKS REPLICATOR
// ============================================

// Get the actual commander from the first hash unit.
// hash_decode() automatically inserts Elaria if no commander exists,
// so we check the original hash separately.
function getActualCommanderFromHash(hash) {
  if (!hash || hash.length < 5) {
    return null;
  }

  const firstUnit = base64_to_unitInfo(hash.substring(0, 5));

  if (!loadCard(firstUnit.id) || !is_commander(firstUnit.id)) {
    return null;
  }

  return firstUnit;
}

// Check whether a unit has a rune.
function hasRune(unit) {
  return Boolean(unit?.runes?.length && unit.runes[0]?.id);
}

// Check whether an inventory card satisfies the reference card's rune rule.
function matchesDeckRune(referenceCard, inventoryCard, anyRune) {
  const referenceHasRune = hasRune(referenceCard);
  const inventoryHasRune = hasRune(inventoryCard);

  // No rune in reference means no rune in inventory.
  if (!referenceHasRune) {
    return !inventoryHasRune;
  }

  // Reference has a rune.
  if (!inventoryHasRune) {
    return false;
  }

  // Any rune is accepted.
  if (anyRune) {
    return true;
  }

  // Otherwise, rune IDs must match exactly.
  return (
    Number(referenceCard.runes[0].id) === Number(inventoryCard.runes[0].id)
  );
}

// Check the minimum level for a card.
function getDeckReplicatorMinLevel(referenceCard, uniqueMinLevel) {
  const cardData = CARDS[referenceCard.id];

  if (!cardData) {
    throw new Error(`Unknown card ID: ${referenceCard.id}`);
  }

  if (UNIQUE_SETS.has(String(cardData.set))) {
    return Number(uniqueMinLevel);
  }

  return Number(referenceCard.level);
}

function replicateDeck(
  referenceHash,
  inventoryCards,
  inventoryCommanderIds,
  uniqueMinLevel,
  anyRune,
) {
  const referenceDeck = hash_decode(referenceHash);
  const referenceCommander = getActualCommanderFromHash(referenceHash);

  if (!referenceCommander) {
    return {
      status: 'rejected',
      reason: 'Reference deck commander could not be identified.',
    };
  }

  // Commander matching is based on ID only.
  if (!inventoryCommanderIds.has(Number(referenceCommander.id))) {
    return {
      status: 'rejected',
      reason: `Commander ID ${referenceCommander.id} is not available in inventory.`,
    };
  }

  if (referenceDeck.deck.length !== 15) {
    return {
      status: 'rejected',
      reason: `Reference deck must contain exactly 15 cards. Found: ${referenceDeck.deck.length}.`,
    };
  }

  const matchResult = matchReferenceCards(
    referenceDeck.deck,
    inventoryCards,
    uniqueMinLevel,
    anyRune,
  );

  const copiedCount = matchResult.matchedCount;

  // Fewer than the minimum number of cards: reject the deck.
  if (copiedCount < MIN_PARTIAL_CARDS) {
    return {
      status: 'rejected',
      copiedCount,
      reason: `Only ${copiedCount} of 15 cards could be matched. Minimum required: ${MIN_PARTIAL_CARDS}.`,
    };
  }

  // Use the reference commander and the actual inventory copies.
  const resultCommander = makeUnitInfo(
    referenceCommander.id,
    referenceCommander.level,
  );

  const resultHash = hash_encode({
    commander: resultCommander,
    deck: matchResult.cards,
  });

  const sortedHash = sortHash(resultHash);

  if (copiedCount === 15) {
    return {
      status: 'full',
      hash: sortedHash,
      copiedCount,
    };
  }

  return {
    status: 'partial',
    hash: sortedHash,
    copiedCount,
    missingCount: 15 - copiedCount,
  };
}

// Find a complete matching between reference cards and inventory cards.
// Uses augmenting paths to avoid greedy matching failures.

function matchReferenceCards(
  referenceCards,
  inventoryCards,
  uniqueMinLevel,
  anyRune,
) {
  const options = referenceCards.map((referenceCard) => {
    const requiredLevel = getDeckReplicatorMinLevel(
      referenceCard,
      uniqueMinLevel,
    );

    return inventoryCards
      .map((inventoryCard, inventoryIndex) => ({
        inventoryCard,
        inventoryIndex,
      }))
      .filter(({ inventoryCard }) => {
        return (
          Number(inventoryCard.id) === Number(referenceCard.id) &&
          Number(inventoryCard.level) >= requiredLevel &&
          matchesDeckRune(referenceCard, inventoryCard, anyRune)
        );
      })
      .map(({ inventoryIndex }) => inventoryIndex);
  });

  // Try cards with the fewest available copies first.
  const sortedReferenceIndexes = options
    .map((_, index) => index)
    .sort((a, b) => options[a].length - options[b].length);

  // inventoryIndex -> referenceIndex
  const assignedInventory = new Map();

  function tryAssign(referenceIndex, visitedInventory) {
    for (const inventoryIndex of options[referenceIndex]) {
      if (visitedInventory.has(inventoryIndex)) {
        continue;
      }

      visitedInventory.add(inventoryIndex);

      const previousReference = assignedInventory.get(inventoryIndex);

      if (
        previousReference === undefined ||
        tryAssign(previousReference, visitedInventory)
      ) {
        assignedInventory.set(inventoryIndex, referenceIndex);
        return true;
      }
    }

    return false;
  }

  // Attempt to match every reference card.
  // Failed cards do not prevent the remaining cards from being matched.
  for (const referenceIndex of sortedReferenceIndexes) {
    tryAssign(referenceIndex, new Set());
  }

  // Restore the original reference deck order.
  const matchedCards = new Array(referenceCards.length);

  for (const [inventoryIndex, referenceIndex] of assignedInventory) {
    matchedCards[referenceIndex] = inventoryCards[inventoryIndex];
  }

  const cards = matchedCards.filter(Boolean);
  const matchedCount = cards.length;

  const missingCards = referenceCards
    .map((card, index) => ({
      card,
      matched: Boolean(matchedCards[index]),
    }))
    .filter((item) => !item.matched)
    .map((item) => item.card);

  return {
    success: matchedCount === referenceCards.length,
    cards,
    matchedCount,
    missingCards,
  };
}

// Replicate one complete reference deck.
function matchReferenceCards(
  referenceCards,
  inventoryCards,
  uniqueMinLevel,
  anyRune,
) {
  const options = referenceCards.map((referenceCard) => {
    const requiredLevel = getDeckReplicatorMinLevel(
      referenceCard,
      uniqueMinLevel,
    );

    return inventoryCards
      .map((inventoryCard, inventoryIndex) => ({
        inventoryCard,
        inventoryIndex,
      }))
      .filter(({ inventoryCard }) => {
        return (
          Number(inventoryCard.id) === Number(referenceCard.id) &&
          Number(inventoryCard.level) >= requiredLevel &&
          matchesDeckRune(referenceCard, inventoryCard, anyRune)
        );
      })
      .map(({ inventoryIndex }) => inventoryIndex);
  });

  // Try cards with the fewest available copies first.
  const sortedReferenceIndexes = options
    .map((_, index) => index)
    .sort((a, b) => options[a].length - options[b].length);

  // inventoryIndex -> referenceIndex
  const assignedInventory = new Map();

  function tryAssign(referenceIndex, visitedInventory) {
    for (const inventoryIndex of options[referenceIndex]) {
      if (visitedInventory.has(inventoryIndex)) {
        continue;
      }

      visitedInventory.add(inventoryIndex);

      const previousReference = assignedInventory.get(inventoryIndex);

      if (
        previousReference === undefined ||
        tryAssign(previousReference, visitedInventory)
      ) {
        assignedInventory.set(inventoryIndex, referenceIndex);
        return true;
      }
    }

    return false;
  }

  // Attempt to match every reference card.
  // Failed cards do not prevent the remaining cards from being matched.
  for (const referenceIndex of sortedReferenceIndexes) {
    tryAssign(referenceIndex, new Set());
  }

  // Restore the original reference deck order.
  const matchedCards = new Array(referenceCards.length);

  for (const [inventoryIndex, referenceIndex] of assignedInventory) {
    matchedCards[referenceIndex] = inventoryCards[inventoryIndex];
  }

  const cards = matchedCards.filter(Boolean);
  const matchedCount = cards.length;

  const missingCards = referenceCards
    .map((card, index) => ({
      card,
      matched: Boolean(matchedCards[index]),
    }))
    .filter((item) => !item.matched)
    .map((item) => item.card);

  return {
    success: matchedCount === referenceCards.length,
    cards,
    matchedCount,
    missingCards,
  };
}

function getInventoryCommanderIds(decodedInventory, inventoryHash) {
  const commanderIds = new Set();

  // The first hash unit may be decoded as the commander.
  const firstCommander = getActualCommanderFromHash(inventoryHash);

  if (firstCommander) {
    commanderIds.add(Number(firstCommander.id));
  }

  // All remaining units are in decodedInventory.deck.
  // Collect every commander regardless of its position in the hash.
  for (const card of decodedInventory.deck) {
    if (is_commander(card.id)) {
      commanderIds.add(Number(card.id));
    }
  }

  return commanderIds;
}

// Process all reference decks.
function generateDeckReplicatorResults(
  referencesInput,
  inventoryHash,
  uniqueMinLevel,
  anyRune,
) {
  const referenceHashes = parseBatchLines(referencesInput, 'Reference decks');

  const decodedInventory = hash_decode(inventoryHash);

  const inventoryCommanderIds = getInventoryCommanderIds(
    decodedInventory,
    inventoryHash,
  );

  const inventoryCards = decodedInventory.deck.filter(
    (card) => !is_commander(card.id),
  );

  const fullResults = [];
  const partialResults = [];
  const rejected = [];

  for (let i = 0; i < referenceHashes.length; i++) {
    try {
      const result = replicateDeck(
        referenceHashes[i],
        inventoryCards,
        inventoryCommanderIds,
        uniqueMinLevel,
        anyRune,
      );

      if (result.status === 'full') {
        fullResults.push(result.hash);

        console.log(`[Decks Replicator] Deck ${i + 1}: fully replicated.`);
      } else if (result.status === 'partial') {
        partialResults.push(result.hash);

        console.log(
          `[Decks Replicator] Deck ${i + 1}: partially replicated ` +
            `(${result.copiedCount}/15 cards).`,
        );
      } else {
        rejected.push({
          deck: i + 1,
          copiedCount: result.copiedCount ?? 0,
          reason: result.reason,
        });

        console.log(
          `[Decks Replicator] Deck ${i + 1}: rejected. ${result.reason}`,
        );
      }
    } catch (error) {
      rejected.push({
        deck: i + 1,
        reason: error.message,
      });

      console.error(`[Decks Replicator] Deck ${i + 1}:`, error);
    }
  }

  console.log('[Decks Replicator] Summary:', {
    references: referenceHashes.length,
    inventoryCards: inventoryCards.length,
    inventoryCommanders: [...inventoryCommanderIds],
    fullyReplicated: fullResults.length,
    partiallyReplicated: partialResults.length,
    rejected: rejected.length,
    rejectedDetails: rejected,
  });

  return {
    fullResults: fullResults.join('\n'),
    partialResults: partialResults
      .sort((a, b) => b.length - a.length)
      .join('\n'),
  };
}

// ============================================
// DECKS REPLICATOR DOM HANDLERS
// ============================================

const deckReplicatorReferences = document.getElementById(
  'deckReplicatorReferences',
);

const deckReplicatorInventory = document.getElementById(
  'deckReplicatorInventory',
);

const deckReplicatorMinLevel = document.getElementById(
  'deckReplicatorMinLevel',
);

const deckReplicatorAnyRune = document.getElementById('deckReplicatorAnyRune');

const deckReplicatorResults = document.getElementById('deckReplicatorResults');

const runDeckReplicator = document.getElementById('runDeckReplicator');

const clearDeckReplicator = document.getElementById('clearDeckReplicator');

const copyDeckReplicatorResults = document.getElementById(
  'copyDeckReplicatorResults',
);

// Replicate decks.
runDeckReplicator.addEventListener('click', function () {
  const referencesInput = deckReplicatorReferences.value.trim();
  const inventoryHash = deckReplicatorInventory.value.trim();

  deckReplicatorResults.value = '';

  if (!referencesInput || !inventoryHash) {
    deckReplicatorResults.value =
      'Please enter both Reference decks and Inventory hashes.';
    return;
  }

  const minLevel = Number(deckReplicatorMinLevel.value);

  if (!Number.isInteger(minLevel) || minLevel < 1 || minLevel > 10) {
    deckReplicatorResults.value =
      'Error: Min card level must be an integer between 1 and 10.';
    return;
  }

  try {
    const results = generateDeckReplicatorResults(
      document.getElementById('deckReplicatorReferences').value,
      document.getElementById('deckReplicatorInventory').value.trim(),
      Number(document.getElementById('deckReplicatorMinLevel').value),
      document.getElementById('deckReplicatorAnyRune').checked,
    );

    document.getElementById('deckReplicatorResults').value =
      results.fullResults;

    document.getElementById('deckReplicatorPartialResults').value =
      results.partialResults;
  } catch (error) {
    console.error('[Decks Replicator]', error);

    deckReplicatorResults.value = 'Error: ' + error.message;
  }
});

// Clear all fields.
clearDeckReplicator.addEventListener('click', () => {
  deckReplicatorReferences.value = '';
  deckReplicatorInventory.value = '';
  deckReplicatorMinLevel.value = '8';
  deckReplicatorAnyRune.checked = false;
  deckReplicatorResults.value = '';
  document.getElementById('deckReplicatorPartialResults').value = '';
});

// Copy results.
copyDeckReplicatorResults.addEventListener('click', () => {
  if (deckReplicatorResults.value) {
    copyToClipboard(deckReplicatorResults.value);
  }
});
