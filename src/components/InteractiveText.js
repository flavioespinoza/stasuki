import React, { Component } from "react";
import PropTypes from "prop-types";

import { isDefined, noop } from "react-stockcharts/lib/utils";

import {
  getValueFromOverride,
  terminate,
  saveNodeType,
  isHoverForInteractiveType,
  isHover,
} from "react-stockcharts/lib/interactive/utils";
import EachText from "./EachText";
import HoverTextNearMouse from 'react-stockcharts/lib/interactive/components/HoverTextNearMouse'
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent'
import { getMouseCanvas } from 'react-stockcharts/lib/GenericComponent'

class InteractiveText extends Component {
  constructor(props) {
    super(props);



    this.handleDraw = this.handleDraw.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragComplete = this.handleDragComplete.bind(this);
    this.terminate = terminate.bind(this);

    this.saveNodeType = saveNodeType.bind(this);
    this.getSelectionState = isHoverForInteractiveType("textList")
      .bind(this);

    this.nodes = [];
    this.state = {};
  }
  handleDrag(index, position) {
    this.setState({
      override: {
        index,
        position,
      }
    });
  }
  handleDragComplete(moreProps) {
    const { override } = this.state;
    if (isDefined(override)) {
      const { textList } = this.props;
      const newTextList = textList
        .map((each, idx) => {
          const selected = (idx === override.index);
          return selected
            ? {
              ...each,
              position: override.position,
              selected,
            }
            : {
              ...each,
              selected
            };
        });
      this.setState({
        override: null,
      }, () => {
        this.props.onDragComplete(newTextList, moreProps);
      });
    }
  }
  handleDrawLine(xyValue) {
    const { current } = this.state;

    if (isDefined(current) && isDefined(current.start)) {
      this.setState({
        current: {
          start: current.start,
          end: xyValue,
        }
      });
    }
  }

  handleDraw(moreProps, e) {
    const { enabled } = this.props;
    // const { enabled } = true;
    if (enabled) {
      const {
        mouseXY: [, mouseY],
        chartConfig: { yScale },
        xAccessor,
        currentItem,
      } = moreProps;

      const xyValue = [xAccessor(currentItem), yScale.invert(mouseY)];

      const { defaultText, onChoosePosition } = this.props;

      const newText = {
        ...defaultText,
        position: xyValue,
      };
      onChoosePosition(newText, moreProps, e);
    }/*  else {
			this.handleClick(moreProps, e);
		} */
  }

  render() {
    const { textList, defaultText } = this.props;
    const { override } = this.state;
    return <g>
      {textList.map((each, idx) => {
        const props = {
          ...defaultText,
          ...each,
        };
        return <EachText key={idx}
                         ref={this.saveNodeType(idx)}
                         index={idx}
                         {...props}
                         selected={each.selected}
                         position={getValueFromOverride(override, idx, "position", each.position)}

                         onDrag={this.handleDrag}
                         onDragComplete={this.handleDragComplete}
                         edgeInteractiveCursor="react-stockcharts-move-cursor"
        />;
      })}
      <GenericChartComponent

        onClick={this.handleDraw}

        svgDraw={noop}
        canvasDraw={noop}
        canvasToDraw={getMouseCanvas}

        drawOn={["mousemove", "pan"]}
      />;
    </g>;
  }
}

InteractiveText.propTypes = {
  onChoosePosition: PropTypes.func.isRequired,
  onDragComplete: PropTypes.func.isRequired,
  onSelect: PropTypes.func,

  defaultText: PropTypes.shape({
    bgFill: PropTypes.string.isRequired,
    bgOpacity: PropTypes.number.isRequired,
    textFill: PropTypes.string.isRequired,
    fontFamily: PropTypes.string.isRequired,
    fontWeight: PropTypes.string.isRequired,
    fontStyle: PropTypes.string.isRequired,
    fontSize: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,

  hoverText: PropTypes.object.isRequired,
  textList: PropTypes.array.isRequired,
  enabled: PropTypes.bool.isRequired,
};

InteractiveText.defaultProps = {
  onChoosePosition: noop,
  onDragComplete: noop,
  onSelect: noop,
  enabled: true,
  defaultText: {
    bgFill: "#D3D3D3",
    bgOpacity: 1,
    textFill: "#F10040",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontStyle: "normal",
    fontWeight: "normal",
    text: "Lorem ipsum..."
  },
  hoverText: {
    ...HoverTextNearMouse.defaultProps,
    enable: true,
    bgHeight: 18,
    bgWidth: 175,
    text: "Click and drag the edge circles",
  },
  textList: [],
};

InteractiveText.contextTypes = {
  subscribe: PropTypes.func.isRequired,
  unsubscribe: PropTypes.func.isRequired,
  generateSubscriptionId: PropTypes.func.isRequired,
  chartId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default InteractiveText;