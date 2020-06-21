export default {
  name: '聖アンテルスの墓地 - 入口',
  bgm: 'catacomb',
  enemyLevel: 20,
  enemyGroups: [
    ['phantom'],
    ['phantom', 'phantom'],
    ['skull'],
    ['skull', 'skull']
  ],
  create (scene) {
    const soldier = scene.map.getObjectById(11)
    soldier.setDisplayName(t('chara.guard')).setTapEvent(async chara => {
      await scene.talk([
        { chara, text: 'ここから先へは十分に注意して進んでくれ。' },
        { chara, text: '近年、出没するモンスターが増えてきて、我々も手に負えなくなってきているんだ。' }
      ])
    })
    scene.ui.sleep(2000).then(() => {
      scene.tweetOnce(scene.player, t('tweet.ct1'), 'ct1')
    })
  }
}
