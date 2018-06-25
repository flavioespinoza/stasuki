import React from 'react'
import Slider from 'react-rangeslider'
import 'react-rangeslider/lib/index.css'

class RangeSliderCenterLabel extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      horizontal: 10,
      vertical: 50
    }
  }

  handleChangeHorizontal = value => {
    this.setState({
      horizontal: value
    })
  };

  handleChangeVertical = value => {
    this.setState({
      vertical: value
    })
  };

  render () {
    const { horizontal, vertical } = this.state
    const horizontalLabels = {
      0: 'Low',
      50: 'Medium',
      100: 'High'
    }

    const verticalLabels = {
      10: 'Getting started',
      50: 'Half way',
      90: 'Almost done',
      100: 'Complete!'
    }

    const formatkg = value => value + ' kg'
    const formatPc = p => p + '%'

    return (
      <div className='slider custom-labels'>
        <Slider
          min={0}
          max={100}
          value={horizontal}
          labels={horizontalLabels}
          format={formatkg}
          handleLabel={horizontal}
          onChange={this.handleChangeHorizontal}
        />
        <div className='value'>{formatkg(horizontal)}</div>
      </div>
    )
  }
}

export default RangeSliderCenterLabel