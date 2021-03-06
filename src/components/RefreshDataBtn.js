
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as actions from '../actions/chartDataActions'
import { ___get_data } from '../index'

class RefreshDataBtn extends React.Component {
  constructor (props) {
    super(props)

    this.refreshData = this.refreshData.bind(this)

    this.state = {}
  }

  refreshData() {
    ___get_data()
  }

  componentWillMount() {
    const actions = this.props.actions
  }

  render() {

    const style = {
      btn: {
        color: 'white'
      }
    }

    return (
      <button onClick={this.refreshData} className="mdl-button mdl-js-button mdl-button--icon">
        <i style={style.btn} className="material-icons">refresh</i>
      </button>
    )
  }
}

function mapStateToProps (state) {
  return {
    data: state.chartData.candleData,
    balances: state.chartData.balances,
    height: 1200,
    openOrders: state.chartData.openOrders,
    textList_1: state.chartData.textList_1,
    orderHistory: state.chartData.orderHistory,
    orderHistoryList_1: state.chartData.orderHistoryList_1,
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
    close: state.chartData.close,
    enableFib: state.chartData.enableFib,
    toggleFibOrder: state.chartData.toggleFibOrder,
    retracements_1: state.chartData.retracements_1,
    retracements_3: state.chartData.retracements_3,
    resistance_high: state.chartData.resistance_high,
    resistance_mid: state.chartData.resistance_mid,
    resistance_low: state.chartData.resistance_low,
    inputStep: state.chartData.inputStep
  }
}

function mapDispatchToProps (dispatch) {
  return {
    chartDataActions: bindActionCreators(actions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RefreshDataBtn);

