import Area from './Area'
import Gate from './Gate'
import Character from './Character'
import Substance from './Substance'
import TreasureChest from './TreasureChest'
import config from '../data/config'
export default class Field {
  constructor (scene, mapKey) {
    scene.add.existing(this)
    this.scene = scene
    this.name = mapKey
    const tilemap = new Phaser.Tilemaps.ParseToTilemap(scene, mapKey)
    this.width = tilemap.widthInPixels
    this.height = tilemap.heightInPixels
    const tilesets = this._getTilesets(tilemap)
    tilemap.layers.push(this._generateTopLayer(tilemap))
    this.staticLayers = tilemap.layers.map((layer, i) => {
      return layer.visible ? tilemap.createStaticLayer(i, tilesets, 0, 0) : null
    }).filter(Boolean)
    const lights = this._generateLights(tilemap)
    this._renderDarkness(lights, this._getExposures(tilemap))
    this.images = tilemap.images.map(data => this._getImage(data))
    const collides = this._getTileIdsByType(tilemap, 'collides')
    this.staticLayers.forEach(layer => layer.setCollision(collides))
    this.staticLayers[this.staticLayers.length - 1].setDepth(100000)
    scene.physics.add.collider(this.staticLayers, scene.substances)
    this.gates = this._getObjects(tilemap, 'gate').map(this._toAreaData).map(gate => new Gate(scene, gate.key, gate.x, gate.y, gate.zone_x, gate.zone_y, gate.zone_width, gate.zone_height).setId(gate.id))
    this.areas = this._getObjects(tilemap, 'area').map(this._toAreaData).map(area => new Area(scene, area.zone_x, area.zone_y, area.zone_width, area.zone_height).setId(area.id))
    this.charas = this._getObjects(tilemap, 'chara').map(data => new Character(scene, data.x, data.y, data.name).setR((data.rotation + 90) * (Math.PI / 180)).setId(data.id))
    this.objects = this._getObjects(tilemap, 'object').map(data => new Substance(scene, data.x, data.y, data.name).setId(data.id))
    this.treasures = this._getObjects(tilemap, 'treasure').map(data => new TreasureChest(scene, data.x, data.y, Number(data.name), `${mapKey}_${data.id}`, data.rotation === 90).setId(data.id))
  }
  getObjectById (id) {
    return ['charas', 'gates', 'areas', 'objects', 'treasures'].reduce((found, key) => {
      return found || this[key].find(v => v.id === id)
    }, null)
  }
  getImageByName (name) {
    return this.images.find(v => v.name === name)
  }
  isCollides (tileX, tileY) {
    return this.staticLayers.some(layer => {
      const tile = layer.getTileAt(tileX, tileY)
      return tile && tile.collides
    })
  }
  displayDebug () {
    const debugGraphics = this.scene.add.graphics().setAlpha(0.75)
    this.staticLayers.forEach(layer => {
      layer.renderDebug(debugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      })
    })
  }
  // private
  _generateTopLayer (tilemap) {
    const visibleLayers = tilemap.layers.filter(v => v.visible).reverse()
    const topTileIds = this._getTileIdsByType(tilemap, 'top')
    const top = new Phaser.Tilemaps.LayerData({ name: 'topLayer', width: tilemap.width, height: tilemap.height })
    top.data = tilemap.height.toArray().map(y => {
      return tilemap.width.toArray().map(x => {
        const found = visibleLayers.find(v => topTileIds.includes(v.data[y][x].index))
        return new Phaser.Tilemaps.Tile(top, (found ? found.data[y][x].index : -1), x, y, 32, 32, 32, 32)
      })
    })
    return top
  }
  _generateLights (tilemap) {
    const lights = this._getTileSettingsByType(tilemap, 'light')
    const lightTiles = this.staticLayers.map(layer => {
      return layer.layer.data.map(row => {
        return row.filter(tile => lights.map(v => v.id).includes(tile.index))
      }).filter(arr => arr.length).flatMap(v => v)
    }).filter(arr => arr.length).flatMap(v => v)
    const dropLight = id => lights.find(l => l.id === id).properties.direction === 'bottom'
    return lightTiles.map(v => {
      const sprite = this.scene.add.sprite(v.x.toPixelCenter, v.y.toPixelCenter, 'lamp').setScale(0.5).setBlendMode(Phaser.BlendModes.OVERLAY).setDepth(100000)
      if (dropLight(v.index)) this.scene.add.sprite(v.x.toPixelCenter, v.y.toPixelCenter + 55, 'lamp').setScale(0.6).setBlendMode(Phaser.BlendModes.OVERLAY).setDepth(100000)
      this.scene.add.tween({
        targets: sprite, duration: Math.randomInt(300, 400),
        scale: 0.6, alpha: 0.8,
        yoyo: true, loop: -1
      })
      return sprite
    })
  }
  _renderDarkness (lights, exposures) {
    if (lights.length === 0) return
    const posAndSize = [0, 0, this.width, this.height]
    const dark = this.scene.add.renderTexture(...posAndSize).fill(0x000000, 0.8, ...posAndSize).setOrigin(0.0).setDepth(110000)
    const brush = this.scene.add.image(0, 0, 'lamp').setScale(3, 3)
    lights.forEach(light => dark.erase(brush, light.x, light.y, 1))
    exposures.forEach(exp => dark.erase(brush, exp.x, exp.y, 1))
    return dark
  }
  _getTilesets (tilemap) {
    return tilemap.tilesets.map(tileset => tilemap.addTilesetImage(tileset.name, `tileset/${tileset.name}`, 32, 32, 1, 2))
  }
  _getTileSettingsByType (tilemap, type) {
    return tilemap.tilesets.map(set => {
      const data = this.scene.cache.json.get(set.name)
      return data.tiles.filter(tile => tile.type.split(',').includes(type)).map(tile => {
        const properties = tile.properties ? tile.properties.reduce((obj, v) => {
          obj[v.name] = v.value
          return obj
        }, {}) : null
        return { id: tile.id + set.firstgid, properties }
      })
    }).flat()
  }
  _getTileIdsByType (tilemap, type) {
    return this._getTileSettingsByType(tilemap, type).map(v => v.id)
  }
  _getObjects (tilemap, type) {
    return tilemap.objects.map(v => v.objects).flat().filter(v => v.type === type)
  }
  _getExposures (tilemap) {
    const expLayer = tilemap.objects.find(l => l.name === 'exposure')
    return expLayer ? expLayer.objects : []
  }
  _getImage (data) {
    const image = data.image.split('/').slice(-1)[0].split('.')[0]
    const sprite = this.scene.add.sprite(data.x, data.y, `tileset/${image}`).setOrigin(0, 0)
    sprite.name = data.name
    return sprite
  }
  _toAreaData (v) {
    return {
      id: v.id,
      key: v.name,
      x: v.properties && v.properties.find(v => v.name === 'x').value,
      y: v.properties && v.properties.find(v => v.name === 'y').value,
      zone_x: v.x,
      zone_y: v.y,
      zone_width: v.width,
      zone_height: v.height
    }
  }
}
