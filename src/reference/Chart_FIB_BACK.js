import React from 'react'
import PropTypes from 'prop-types'

import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'

// import ChartCanvas from '../lib/ChartCanvas'
// import Chart from '../lib/Chart'

import { ChartCanvas, Chart } from 'react-stockcharts'

import { CandlestickSeries } from 'react-stockcharts/lib/series'

import {
  BarSeries,
  AreaSeries,
  LineSeries,
  MACDSeries
} from 'react-stockcharts/lib/series'

// import XAxis from 'react-stockcharts/lib/axes/XAxis'
// import YAxis from './YAxis'

import { XAxis, YAxis } from 'react-stockcharts/lib/axes'


import {
  CrossHairCursor,
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY
} from 'react-stockcharts/lib/coordinates'

import PriceCoordinate from '../components/PriceCoordinate'

import { Annotate, LabelAnnotation, Label } from 'react-stockcharts/lib/annotation'

import { discontinuousTimeScaleProvider } from 'react-stockcharts/lib/scale'
import {
  MovingAverageTooltip,
  MACDTooltip
} from 'react-stockcharts/lib/tooltip'

import ZoomButtons from '../lib/ZoomButtons'

import OHLCTooltip from '../components/OHLCTooltip'

import OrderMarker from '../components/OrderMarker'
import nearest from 'nearest-date'

import { ema, macd, sma } from 'react-stockcharts/lib/indicator'
import { DrawingObjectSelector } from 'react-stockcharts/lib/interactive'

import FibonacciRetracement from '../lib/interactive/FibonacciRetracement'
import Ruler from '../lib/interactive/Ruler'

import { fitWidth } from 'react-stockcharts/lib/helper'
import { last, toObject } from 'react-stockcharts/lib/utils'
import {
  saveInteractiveNodes,
  getInteractiveNodes
} from '../components/interactiveutils'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as chartDataActions from '../actions/chartDataActions'
import store from '../Store'

import _ from 'lodash'
import moment from 'moment'
import $ from 'jquery'
import Chance from 'chance'
import { head } from 'react-stockcharts/lib/utils/index'
import { getMorePropsForChart } from 'react-stockcharts/lib/interactive/utils'

import io from 'socket.io-client'
import __endpoint from '../endpoints/endpoint'

function ___timestamp () {
  let timestamp = Date.now()
  return timestamp
}

function __cancel_order (__order_id) {
  socket.emit('Cancel Order', __order_id)
  $('.order-info').html('')
}

function __cancel_all_orders (__orders) {
  for (let i = 0; i < __orders.length; i++) {
    socket.emit('Cancel Order', __orders[i].id)
  }
  $('.order-info').html('')
}

/** SELECTED ORDERS */
const orders_selected = []

let state = store.getState()

// /** Order Book */
socket.on('order_book', function (__order_book) {
  let order_book = []
  let buy = []
  let sell = []
  _.each(__order_book.order_book.buy, function (__buy, i) {
    buy.push({
      amount: __buy.Quantity,
      price: __buy.Rate,
      side: 'buy',
    })
  })
  _.each(__order_book.order_book.sell, function (__sell, i) {
    sell.push({
      amount: __sell.Quantity,
      price: __sell.Rate,
      side: 'sell',
    })
  })

  let concat = buy.concat(sell)
  // console.log('concat', concat)

})

/** OPEN OREDERS */
socket.on('open_orders', function (__open_orders) {

  store.dispatch({type: 'SET_OPEN_ORDERS', payload: __open_orders})
})

/** ORDER HISTORY */
socket.on('order_history', function (__order_history) {
  store.dispatch({type: 'SET_ORDER_HISTORY', payload: __order_history})
  // console.log('order_history', __order_history.length)
})

/** PARADIGM */
store.dispatch({type: 'SET_PARADIGM', payload: 'three'})
localStorage.setItem('paradigm', 'three')

const macdAppearance = {
  stroke: {
    macd: '#FF0000',
    signal: '#00F300'
  },
  fill: {
    divergence: '#4682B4'
  }
}

/** CHART ========================================================= */
class CandleStickChartWithFibonacciInteractiveIndicator extends React.Component {
  constructor (props) {
    super(props)

    this.onKeyPress = this.onKeyPress.bind(this)

    this.onFibComplete = this.onFibComplete.bind(this)
    this.onFibComplete_1 = this.onFibComplete_1.bind(this)
    this.onFibComplete_3 = this.onFibComplete_3.bind(this)


    this.newFibOrder = this.newFibOrder.bind(this)
    this.confirmOrder = this.confirmOrder.bind(this)
    this.deleteFib = this.deleteFib.bind(this)
    this.placeOrder = this.placeOrder.bind(this)

    this.handleSelection = this.handleSelection.bind(this)

    /** Open Orders & Order History */
    this.setAllOrders = this.setAllOrders.bind(this)
    this.handleChoosePosition = this.handleChoosePosition.bind(this)
    this.onDragComplete = this.onDragComplete.bind(this)

    this.saveInteractiveNodes = saveInteractiveNodes.bind(this)
    this.getInteractiveNodes = getInteractiveNodes.bind(this)

    this.saveCanvasNode = this.saveCanvasNode.bind(this)

    this.cancelAllOrders = this.cancelAllOrders.bind(this)

    this.saveNode = this.saveNode.bind(this)
    this.resetYDomain = this.resetYDomain.bind(this)
    this.handleReset = this.handleReset.bind(this)

    this.onRulerStart = this.onRulerStart.bind(this)
    this.onRulerComplete = this.onRulerComplete.bind(this)

    this.state = {

      enableFib: false,
      retracements: [],
      retracements_1: [],
      retracements_3: [],

      enableOrderMarker: false,
      textList_1: [],

      enableOrderHistoryMarker: false,
      orderHistory: [],

      enableRuler: false,
      rulers: [],

      showModal: false,
      intervalId: null,
      chartHeight: 900,

    }

    store.dispatch({type: 'SET_RETRACEMENTS', payload: this.state.retracements_1})

  }

  componentWillMount () {
    const {market, symbol} = this.props
    this.props.chartDataActions.setMarket(market)
    this.props.chartDataActions.setSymbol(symbol)
  }

  componentDidMount () {

    document.addEventListener('keyup', this.onKeyPress)

    document.getElementById('newFibOrder').addEventListener('click', this.newFibOrder)
    // document.getElementById('confirm').addEventListener('click', this.confirmOrder)
    document.getElementById('resetYDomain').addEventListener('click', this.resetYDomain)
    // document.getElementById('cancelAllOrders').addEventListener('click', this.cancelAllOrders)

    // store intervalId in the state so it can be accessed later:

    const chartHeight =  document.getElementById('chart').clientHeight
    let intervalId = setInterval(this.setAllOrders, 5000)

    this.setState({
      chartHeight: chartHeight,
      intervalId: intervalId
    })


    /** ORDER CONFIRMATIONS */
    // socket.on('limit_buy_placed', function (limit_buy_placed) {
    //   console.log('limit_buy_placed', limit_buy_placed)
    // })
    // socket.on('limit_sell_placed', function (limit_sell_placed) {
    //   console.log('limit_sell_placed', limit_sell_placed)
    // })
    // socket.on('order_canceled_res', function (order_canceled_res) {
    //   console.log('order_canceled_res', order_canceled_res)
    // })
    // socket.on('replace_order_res', function (replace_order_res) {
    //   console.log('replace_order_res', replace_order_res)
    // })

  }

  componentWillUnmount () {
    document.removeEventListener('keyup', this.onKeyPress)
  }

  onFibComplete (retracements_1) {

    // console.log('selected', retracements_1)
    store.dispatch({type: 'SET_RETRACEMENTS', payload: retracements_1})

    this.setState({
      retracements_1,
      enableFib: false
    })

  }


  onFibComplete_1 (retracements_1) {
    // console.log('onFibComplete_1', retracements_1)
    this.setState({
      retracements_1,
      enableFib: false
    })
  }

  onFibComplete_3 (retracements_3) {
    this.setState({
      retracements_3,
      enableFib: false
    })
  }

  saveNode (node) {
    this.node = node
  }

  resetYDomain () {
    this.canvasNode.resetYDomain()
  }

  saveCanvasNode (node) {
    this.canvasNode = node
  }

  newFibOrder () {
    this.setState({
      enableFib: true
    })
  }

  deleteFib () {
    let retracements_1 = this.state.retracements_1.filter(function (each) {
      return !each.selected
    })

    //FIXME: Add function to clear all data and re-run calculations on delete or switch of fib order
    store.dispatch({type: 'SET_BASE_AMOUNT', payload: 0})

    this.setState({
      retracements_1
    })
  }

  confirmOrder () {

    const risk = this.props.risk
    const base = this.props.base
    const comp = this.props.comp

    let retracements_1 = this.state.retracements_1
    let selected = _.find(retracements_1, function (__each) {
      return __each.selected
    })

    let paradigm = this.props.paradigm
    let __paradigm = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]
    let __paradigms = {
      eleven: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
      seven: [100, 90, 80, 70, 60, 50, 0],
      three: [100, 50, 0]
    }
    if (paradigm === 'three') {
      __paradigm = __paradigms.three
    } else if (paradigm === 'seven') {
      __paradigm = __paradigms.seven
    } else if (paradigm === 'eleven') {
      __paradigm = __paradigms.eleven
    } else {
      __paradigm = [100, 75, 50, 25, 0]
    }

    let amounts = []
    let riskDivision = this.props.riskDivision

    for (let i = 0; i < __paradigm.length; i++) {
      let __id = __paradigm[i] + '_inputAmount'
      let __amount = riskDivision
      amounts.push({
        id: __id,
        percent: __paradigm[i],
        amount: +__amount
      })
    }

    // console.log('amounts', amounts);
    this.placeOrder(selected, amounts)
  }

  placeOrder (__selected, __amounts) {

    const balances = this.props.balances
    const risk = this.props.risk
    const base = this.props.base
    const comp = this.props.comp
    const __market = this.props.market
    const __symbol = this.props.symbol
    const __side = this.props.side

    if (!__selected) {
      alert('You must select an Fib to place order!')
      return
    }

    let paradigm = this.props.paradigm

    let __fib_orders = []
    let __dy = __selected.y2 - __selected.y1
    let __paradigm = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]
    let __paradigms = {
      eleven: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
      seven: [100, 90, 80, 70, 60, 50, 0],
      three: [100, 50, 0]
    }
    if (paradigm === 'three') {
      __paradigm = __paradigms.three
    } else if (paradigm === 'seven') {
      __paradigm = __paradigms.seven
    } else if (paradigm === 'eleven') {
      __paradigm = __paradigms.eleven
    } else {
      __paradigm = [100, 75, 50, 25, 0]
    }
    let __price = 0

    for (let i = 0; i < __paradigm.length; i++) {

      let __price = (__selected.y2 - (__paradigm[i] / 100) * __dy)

      __fib_orders.push({
        timestamp: ___timestamp(),
        side: __side,
        market: __market,
        symbol: __symbol,
        price: __price,
        amount: __amounts[i].amount.toFixed(6),
        type: 'limit'
      })

    }

    // console.log('__fib_orders', JSON.stringify(__fib_orders, null, 2))

    if (__side === 'buy') {
      socket.emit('Place Limit Buy Fib Orders', __fib_orders)
    } else if (__side === 'sell') {
      socket.emit('Place Limit Sell Fib Orders', __fib_orders)
    }

    this.deleteFib()

  }

  setAllOrders () {

    const __self = this
    const openOrders = __self.props.orders
    const orderHistory = __self.props.orderHistory
    // const allOrders = __self.props.allOrders
    const allOrders = openOrders.concat(orderHistory)

    _.each(allOrders, function (__order, i) {
      _.each(orders_selected, function (__selected) {
        if (__order.id === __selected.id) {
          allOrders[i].selected = true
        }
      })
    })

    setTimeout(function () {
      __self.setState({
        textList_1: allOrders
      })
    }, 700)

  }

  cancelSingleOrder () {

    let orders = this.props.orders

    let __open_orders = orders.filter(function (d) {

      if (d.selected) {
        d.canceled = true
        __cancel_order(d.order.OrderUuid)
        console.log('__order_to_cancel', d.selected)

      }

      return !d.selected

    })

  }

  cancelAllOrders () {

    let __self = this
    let state = store.getState()
    let ordersCancelled = this.props.ordersCancelled
    let orders = this.props.orders

    let __orders = _.filter(orders, function (__order) {
      return __order.id
    })
    __cancel_all_orders(__orders)

    __self.props.chartDataActions.setOpenOrders([])
    __self.setState({
      textList_1: []
    })
    setTimeout(function () {
      __self.props.chartDataActions.setOpenOrders([])
      __self.setState({
        textList_1: []
      })
    }, 3000)

  }

  handleSelection (interactives) {

    // console.log('interactives', interactives)
    const state = toObject(interactives, each => {
      return [
        `retracements_${each.chartId}`,
        each.objects
      ]
    })

    // console.log('state', state)
    this.setState(state)
  }

  handleChoosePosition (text, moreProps) {

    let cancelledOrders = this.props.cancelledOrders
    moreProps.cancelledOrders = cancelledOrders

    this.componentWillUnmount()

    const {override} = this.state

    const {id: chartId} = moreProps.chartConfig
    const {
      mouseXY: [, mouseY],
      xAccessor,
      currentItem
    } = moreProps

    const yScale = moreProps.chartConfig[0].yScale

    const xyValue = [xAccessor(currentItem), yScale.invert(mouseY)]

    let __price = yScale.invert(mouseY)

  }

  replaceExistingOrder (__new_order) {

    socket.emit('Replace Order', __new_order)

  }

  onDragComplete (textList, moreProps) {

    let ordersCancelled = this.props.ordersCancelled
    moreProps.ordersCancelled = ordersCancelled

    const {id: chartId} = moreProps.chartConfig
    const state = store.getState()

    const {
      mouseXY: [, mouseY],
      chartConfig: {yScale}
    } = moreProps

    let orders = this.props.orders
    let exist_order = _.find(textList, {selected: true})

    __cancel_order(exist_order.id)

    ordersCancelled.push(exist_order.id)

    let cancelledArray = this.props.chartDataActions.getOrdersCancelled(state)

    for (let i = 0; i < textList.length; i++) {

      textList[i].ordersCancelled = cancelledArray
    }

    let __open_orders_remaining = _.filter(textList, function (o) { return o.id != exist_order.id })

    // console.log('ORDERS REMAINING', JSON.stringify(textList, null, 2))

    store.dispatch({type: 'SET_OPEN_ORDERS', payload: __open_orders_remaining})

    this.setState({
      textList_1: __open_orders_remaining
    })

    exist_order.order_params.price = yScale.invert(mouseY)

    let __new_order = exist_order.order_params

    // this.replaceExistingOrder(__new_order)

  }

  onRulerStart (e) {
    console.log('onRulerStart', e)
  }

  onRulerComplete (rulers) {

    // console.log('onRulerComplete', rulers)
    store.dispatch({type: 'SET_RULERS', payload: rulers})

    this.setState({
      rulers,
      enableRuler: false
    })

  }

  newRuler () {
    this.setState({
      enableRuler: true
    })
  }

  deleteRuler () {
    let rulers = this.state.rulers.filter(function (each) {
      // console.log('rulers', JSON.stringify(each, null, 2))
      return !each.selected
    })

    this.setState({
      rulers
    })
  }

  onKeyPress (e) {
    console.log(e.which)
    let keyCode = e.which
    let baseAmount = this.props.baseAmount

    switch (keyCode) {
      case 65: { // A
        this.resetYDomain()
      }
      case 8: // DEL Macbook Pro
      case 46: { // DEL PC

        const retracements_1 = this.state.retracements_1
          .filter(each => !each.selected)
        const retracements_3 = this.state.retracements_3
          .filter(each => !each.selected)

        this.canvasNode.cancelDrag()
        this.setState({
          retracements_1,
          retracements_3
        })
        this.deleteFib()
        this.deleteRuler()
        break
      }
      case 27: { // ESC

        this.setState({
          enableOrderMarker: false,
          enableOrderHistoryMarker: false,
          enableFib: false,
          enableRuler: false,
        })
        this.props.chartDataActions.enableFib(false)
        break
      }
      case 70: { // F - Enable Fib
        this.setState({
          enableFib: true
        })
        this.props.chartDataActions.enableFib(true)
        this.newFibOrder()
        break
      }
      case 82: { // Ruler
        this.newRuler()
      }
    }
  }

  handleReset () {
    this.setState({
      suffix: this.state.suffix + 1
    })
  }

  render () {

    const __self = this

    const {type, data: initialData, width, ratio, interval, market, symbol, base, comp} = this.props

    const margin = {left: 72, right: 72, top: 40, bottom: 40}
    const height = this.state.chartHeight

    const ema26 = ema()
      .id(0)
      .options({windowSize: 26})
      .merge((d, c) => { d.ema26 = c })
      .accessor(d => d.ema26)

    const ema12 = ema()
      .id(1)
      .options({windowSize: 12})
      .merge((d, c) => {d.ema12 = c})
      .accessor(d => d.ema12)

    const macdCalculator = macd()
      .options({
        fast: 12,
        slow: 26,
        signal: 9
      })
      .merge((d, c) => {d.macd = c})
      .accessor(d => d.macd)

    const smaVolume50 = sma()
      .id(3)
      .options({
        windowSize: 50,
        sourcePath: 'volume'
      })
      .merge((d, c) => {d.smaVolume50 = c})
      .accessor(d => d.smaVolume50)

    const calculatedData = macdCalculator(smaVolume50(ema12(ema26(initialData))))
    const xScaleProvider = discontinuousTimeScaleProvider
      .inputDateAccessor(d => d.date)
    const {
      data,
      xScale,
      xAccessor,
      displayXAccessor
    } = xScaleProvider(calculatedData)

    const start = xAccessor(last(data))
    const end = xAccessor(data[Math.max(0, data.length - 150)])
    const xExtents = [start, end]

    const __data = this.props.data

    function currencyFormat () {
      // if (base === 'USDT') {
      //   return '.2f'
      // } else {
      //   return '.8f'
      // }
      return '.8f'
    }

    return (
      <ChartCanvas ref={this.saveCanvasNode}
                   height={height}
                   width={width}
                   ratio={ratio}
                   margin={margin}
                   type={type}
                   interval={interval}
                   seriesName="series"
                   data={data}
                   xScale={xScale}
                   xAccessor={xAccessor}
                   displayXAccessor={displayXAccessor}
                   xExtents={xExtents}>

        <Chart id={1}
               yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
               padding={{top: 10, bottom: 20}}>

          <XAxis axisAt="top"
                 orient="top"
                 ticks={12}
                 xZoomHeight={40}
                 stroke="#757575"
                 tickStroke="#757575"/>

          <XAxis axisAt="bottom"
                 orient="bottom"
                 ticks={12}
                 xZoomHeight={40}
                 stroke="#757575"
                 tickStroke="#757575"/>

          <YAxis axisAt="left"
                 orient="left"
                 ticks={12}
                 bg={{x: 0, y: -40, w: 72, h: height}}
                 className="y-axis-left"
                 fill="#FFF604"
                 stroke="#757575"
                 tickStroke="#757575"/>

          <YAxis axisAt="right"
                 orient="right"
                 ticks={12}
                 bg={{x: 72, y: -40, w: 72, h: height}}
                 className="y-axis-right"
                 stroke="#757575"
                 tickStroke="#757575"/>

          <MouseCoordinateX at="top"
                            orient="top"
                            displayFormat={timeFormat('%b %e, %_I:%M %p')}/>

          <MouseCoordinateX at="bottom"
                            orient="bottom"
                            displayFormat={timeFormat('%b %e, %_I:%M %p')}/>

          <MouseCoordinateY at="right"
                            orient="right"
                            displayFormat={format(currencyFormat())}/>

          <MouseCoordinateY at="left"
                            orient="left"
                            displayFormat={format(currencyFormat())}/>

          <EdgeIndicator itemType="last" orient="left" edgeAt="left"
                         yAccessor={d => d.close}
                         fill={d => d.close > d.open ? '#6BA583' : '#FF0000'}
                         displayFormat={format(currencyFormat())}/>

          <EdgeIndicator itemType="last" orient="right" edgeAt="right"
                         yAccessor={d => d.close}
                         fill={d => d.close > d.open ? '#6BA583' : '#FF0000'}
                         displayFormat={format(currencyFormat())}/>

          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format('.2f')}/>

          <CandlestickSeries/>


          <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()}/>
          <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()}/>

          <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()}/>
          <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()}/>

          {/*<EdgeIndicator itemType="last" orient="right" edgeAt="right"*/}
          {/*yAccessor={d => d.close}*/}
          {/*fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}/>*/}

          <OHLCTooltip origin={[12, 24]} fontSize={11}/>

          <MovingAverageTooltip
            onClick={e => console.log(e)}
            origin={[12, 38]}
            options={[
              {
                yAccessor: ema26.accessor(),
                type: ema26.type(),
                stroke: ema26.stroke(),
                windowSize: ema26.options().windowSize
              },
              {
                yAccessor: ema12.accessor(),
                type: ema12.type(),
                stroke: ema12.stroke(),
                windowSize: ema12.options().windowSize
              }
            ]}
          />

          <FibonacciRetracement
            ref={this.saveInteractiveNodes('FibonacciRetracement', 1)}
            enabled={this.state.enableFib}
            retracements={this.state.retracements_1}
            onComplete={this.onFibComplete_1}/>

          <ZoomButtons onReset={this.handleReset}/>


          <OrderMarker
            selected={true}
            ref={this.saveInteractiveNodes('OrderMarker', 1)}
            enabled={this.state.enableOrderMarker}
            text="0"
            textList={this.state.textList_1}
            onDragComplete={this.onDragComplete}/>

          <Ruler ref={this.saveInteractiveNodes('Ruler', 1)}
                 enabled={this.state.enableRuler}
                 rulers={this.state.rulers}
                 onStart={this.onRulerStart}
                 onComplete={this.onRulerComplete}/>

        </Chart>

        <Chart id={2} height={150}
               yExtents={[d => d.volume, smaVolume50.accessor()]}
               origin={(w, h) => [0, h - 300]}
        >
          <YAxis axisAt="left" orient="left" ticks={5} tickFormat={format('.2s')}/>

          <MouseCoordinateY
            at="left"
            orient="left"
            displayFormat={format('.4s')}/>

          <BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? '#6BA583' : '#FF0000'}/>
          <AreaSeries yAccessor={smaVolume50.accessor()} stroke={smaVolume50.stroke()} fill={smaVolume50.fill()}/>
        </Chart>

        <Chart id={3} height={150}
               yExtents={macdCalculator.accessor()}
               origin={(w, h) => [0, h - 150]} padding={{top: 10, bottom: 10}}>

          <XAxis axisAt="bottom" orient="bottom"/>
          <YAxis axisAt="right" orient="right" ticks={2}/>
          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat('%Y-%m-%d')}/>
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format('.2f')}/>

          <MACDSeries yAccessor={d => d.macd}
                      {...macdAppearance} />

          <MACDTooltip
            origin={[12, 24]}
            yAccessor={d => d.macd}
            options={macdCalculator.options()}
            appearance={macdAppearance}
          />

        </Chart>

        <CrossHairCursor/>

        <DrawingObjectSelector
          enabled={!(this.state.enableOrderMarker
            && this.state.enableOrderHistoryMarker
            && this.state.enableFib
            && this.state.enableRuler
          )}
          getInteractiveNodes={this.getInteractiveNodes}
          drawingObjectMap={{
            OrderMarker: 'textList',
            OrderHistory: 'orderHistoryList',
            FibonacciRetracement: 'retracements',
            Ruler: 'rulers',
          }}
          onSelect={this.handleSelection}/>

      </ChartCanvas>
    )
  }
}

CandleStickChartWithFibonacciInteractiveIndicator.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['svg', 'hybrid']).isRequired
}

CandleStickChartWithFibonacciInteractiveIndicator.defaultProps = {
  type: 'svg'
}

CandleStickChartWithFibonacciInteractiveIndicator = fitWidth(CandleStickChartWithFibonacciInteractiveIndicator)

function mapStateToProps (state) {
  return {
    data: state.chartData.candleData,
    balances: state.chartData.balances,
    height: 900,
    orders: state.chartData.openOrders,
    orderHistory: state.chartData.orderHistory,
    allOrders: state.chartData.allOrders,
    orderViewToggle: state.chartData.orderViewToggle,
    ordersCancelled: state.chartData.ordersCancelled,
    margins: {left: 12, right: 56, top: 0, bottom: 0},
    interval: state.chartData.interval,
    market: state.chartData.market,
    symbol: state.chartData.symbol,
    side: state.chartData.side,
    risk: state.chartData.risk,
    base: state.chartData.base,
    comp: state.chartData.comp,
    orderType: state.chartData.orderType,
    paradigm: state.chartData.paradigm,
    paradigmArray: state.chartData.paradigmArray,
    amountsArray: state.chartData.amountsArray,
    riskAmount: state.chartData.riskAmount,
    baseAmount: state.chartData.baseAmount,
    riskDivision: state.chartData.riskDivision,
    close: state.chartData.close
  }
}

function mapDispatchToProps (dispatch) {
  return {
    chartDataActions: bindActionCreators(chartDataActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CandleStickChartWithFibonacciInteractiveIndicator)