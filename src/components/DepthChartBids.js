function bids () {
  let data = [],
    buyOrders = [],
    sellOrders = [],
    __cum_data = [],
    svg,
    defs,
    gBrush,
    brush,
    main_xScale,
    mini_xScale,
    main_yScale,
    mini_yScale,
    main_yZoom,
    main_xAxis,
    main_yAxis,
    mini_width,
    textScale

  const __order_book = order_book


  let prefixSum = function (arr) {
    let builder = function (acc, n) {
      let lastNum = acc.length > 0 ? acc[acc.length - 1] : 0
      acc.push(lastNum + n)
      return acc
    }
    return _.reduce(arr, builder, [])
  }

  init()

  function init () {

    // create cumulative data array
    console.log('__order_book bids', __order_book)
    for (let i = 0; i < __order_book.bids.length; i++) {
      __cum_data.push(__order_book.bids[i].amount)
    }
    let cum_data_array = prefixSum(__cum_data)

    // final data array
    for (let i = 0; i < __order_book.bids.length; i++) {

      let __idx = __order_book.bids[i].price.toFixed(2)

      data.push({
        key: i,
        idx: +__idx,
        country: __idx,
        orders: cum_data_array[i],
        value: cum_data_array[i]
      })
    }

    // reverse data for bids
    data = _.reverse(data)
    data.forEach(function (d) {
      d.orders = +d.orders
    })

    console.log('data', data)

    // data = buyOrders.concat(sellOrders)

    /////////////////////////////////////////////////////////////
    ///////////////// Set-up SVG and wrappers ///////////////////
    /////////////////////////////////////////////////////////////

    //Added only for the mouse wheel
    let zoomer = d3.behavior.zoom()
      .on('zoom', null)

    let main_margin = {top: 10, right: 10, bottom: 10, left: 100},
      main_height = 500 - main_margin.top - main_margin.bottom,
      main_width = 300 - main_margin.left - main_margin.right

    let mini_margin = {top: 10, right: 10, bottom: 10, left: 10},
      mini_height = 500 - mini_margin.top - mini_margin.bottom,
      mini_width = 100 - mini_margin.left - mini_margin.right

    svg = d3.select('#bids').append('svg')
      .attr('class', 'svgWrapperBids')
      .attr('width', main_width + main_margin.left + main_margin.right + mini_width + mini_margin.left + mini_margin.right)
      .attr('height', main_height + main_margin.top + main_margin.bottom)
      .call(zoomer)
      .on('wheel.zoom', scroll)
      .on("mousewheel.zoom", scroll)
      .on("DOMMouseScroll.zoom", scroll)
      .on("MozMousePixelScroll.zoom", scroll)
      //Is this needed?
      .on('mousedown.zoom', null)
      // .on('touchstart.zoom', null)
      // .on('touchmove.zoom', null)
      // .on('touchend.zoom', null)

    let mainGroup = svg.append('g')
      .attr('class', 'mainGroupWrapperBids')
      .attr('transform', 'translate(' + main_margin.left + ',' + main_margin.top + ')')
      .append('g') //another one for the clip path - due to not wanting to clip the labels
      .attr('clip-path', 'url(#clip)')
      .style('clip-path', 'url(#clip)')
      .attr('class', 'mainGroupBids')

    let miniGroup = svg.append('g')
      .attr('class', 'miniGroupBids')
      .attr('transform', 'translate(' + (main_margin.left + main_width + main_margin.right + mini_margin.left) + ',' + mini_margin.top + ')')

    let brushGroup = svg.append('g')
      .attr('class', 'brushGroupBids')
      .attr('transform', 'translate(' + (main_margin.left + main_width + main_margin.right + mini_margin.left) + ',' + mini_margin.top + ')')

    /////////////////////////////////////////////////////////////
    ////////////////////// Initiate scales //////////////////////
    /////////////////////////////////////////////////////////////

    main_xScale = d3.scale.linear().range([0, main_width])
    mini_xScale = d3.scale.linear().range([0, mini_width])

    // main_yScale = d3.scale.ordinal().rangeBands([0, main_height], 0.1, 0)
    // mini_yScale = d3.scale.ordinal().rangeBands([0, mini_height], 0.1, 0)

    main_yScale = d3.scale.ordinal().rangeBands([0, main_height], 0, 0)
    mini_yScale = d3.scale.ordinal().rangeBands([0, mini_height], 0, 0)

    //Based on the idea from: http://stackoverflow.com/questions/21485339/d3-brushing-on-grouped-bar-chart
    main_yZoom = d3.scale.linear()
      .range([0, main_height])
      .domain([0, main_height])

    //Create x axis object
    main_xAxis = d3.svg.axis()
      .scale(main_xScale)
      .orient('bottom')
      .ticks(4)
      //.tickSize(0)
      .outerTickSize(0)

    //Add group for the x axis
    d3.select('.mainGroupWrapperBids').append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + 0 + ',' + (-main_height + 20) + ')')

    //Create y axis object
    main_yAxis = d3.svg.axis()
      .scale(main_yScale)
      .orient('left')
      .tickSize(0)
      .outerTickSize(0)

    //Add group for the y axis
    mainGroup.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(-5,0)')

    /////////////////////////////////////////////////////////////
    /////////////////////// Update scales ///////////////////////
    /////////////////////////////////////////////////////////////

    //Update the scales
    main_xScale.domain([0, d3.max(data, function (d) { return d.value })])
    mini_xScale.domain([0, d3.max(data, function (d) { return d.value })])
    main_yScale.domain(data.map(function (d) { return d.country }))
    mini_yScale.domain(data.map(function (d) { return d.country }))

    //Create the visual part of the y axis
    d3.select('.mainGroupBids').select('.y.axis').call(main_yAxis)
    d3.select('.mainGroupWrapperBids').select('.x.axis').call(main_xAxis)

    /////////////////////////////////////////////////////////////
    ///////////////////// Label axis scales /////////////////////
    /////////////////////////////////////////////////////////////

    textScale = d3.scale.linear()
      .domain([15, 50])
      .range([12, 6])
      .clamp(true)

    /////////////////////////////////////////////////////////////
    ///////////////////////// Create brush //////////////////////
    /////////////////////////////////////////////////////////////

    //What should the first extent of the brush become - a bit arbitrary this
    let brushExtent = Math.max(1, Math.min(20, Math.round(data.length * 0.2)))

    brush = d3.svg.brush()
      .y(mini_yScale)
      .extent([mini_yScale(data[0].country), mini_yScale(data[brushExtent].country)])
      .on('brush', brushmove)
    //.on("brushend", brushend);

    //Set up the visual part of the brush
    gBrush = d3.select('.brushGroupBids').append('g')
      .attr('class', 'brush')
      .call(brush)

    gBrush.selectAll('.resize')
      .append('line')
      .attr('x2', mini_width)

    gBrush.selectAll('.resize')
      .append('path')
      .attr('d', d3.svg.symbol().type('triangle-up').size(20))
      .attr('transform', function (d, i) {
        return i ? 'translate(' + (mini_width / 2) + ',' + 4 + ') rotate(180)' : 'translate(' + (mini_width / 2) + ',' + -4 + ') rotate(0)'
      })

    gBrush.selectAll('rect')
      .attr('width', mini_width)

    //On a click recenter the brush window
    gBrush.select('.background')
      .on('mousedown.brush', brushcenter)
      .on('touchstart.brush', brushcenter)

    ///////////////////////////////////////////////////////////////////////////
    /////////////////// Create a rainbow gradient - for fun ///////////////////
    ///////////////////////////////////////////////////////////////////////////

    defs = svg.append('defs')

    //Create two separate gradients for the main and mini bar - just because it looks fun
    createGradient('gradient-rainbow-main', '60%')
    createGradient('gradient-rainbow-mini', '13%')

    //Add the clip path for the main bar chart
    defs.append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('x', -main_margin.left)
      .attr('width', main_width + main_margin.left)
      .attr('height', main_height)

    /////////////////////////////////////////////////////////////
    /////////////// Set-up the mini bar chart ///////////////////
    /////////////////////////////////////////////////////////////

    //The mini brushable bar
    //DATA JOIN
    let mini_bar = d3.select('.miniGroupBids').selectAll('.bar')
      .data(data, function (d) { return d.key })

    //UDPATE
    mini_bar
      .attr('width', function (d) { return mini_xScale(d.value) })
      .attr('y', function (d, i) { return mini_yScale(d.country) })
      .attr('height', mini_yScale.rangeBand() + 20)

    //ENTER
    mini_bar.enter().append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('width', function (d) { return mini_xScale(d.value) })
      .attr('y', function (d, i) { return mini_yScale(d.country) })
      .attr('height', mini_yScale.rangeBand())
      .style('fill', 'url(#gradient-rainbow-mini)')

    //EXIT
    mini_bar.exit()
      .remove()

    //Start the brush
    gBrush.call(brush.event)

  }//init

//Function runs on a brush move - to update the big bar chart
  function update () {

    /////////////////////////////////////////////////////////////
    ////////// Update the bars of the main bar chart ////////////
    /////////////////////////////////////////////////////////////

    //DATA JOIN
    let bar = d3.select('.mainGroupBids').selectAll('.bar')
      .data(data, function (d) { return d.key })

    //UPDATE
    bar
      .attr('x', 0)
      .attr('width', function (d) { return main_xScale(d.value) })
      .attr('y', function (d, i) { return main_yScale(d.country) })
      .attr('height', main_yScale.rangeBand() + 20)

    //ENTER
    bar.enter().append('rect')
      .attr('class', 'bar')
      .style('fill', 'url(#gradient-rainbow-main)')
      .attr('x', 0)
      .attr('width', function (d) { return main_xScale(d.value) })
      .attr('y', function (d, i) { return main_yScale(d.country) })
      .attr('height', main_yScale.rangeBand() + 20)

    //EXIT
    bar.exit()
      .remove()

  }//update

/////////////////////////////////////////////////////////////
////////////////////// Brush functions //////////////////////
/////////////////////////////////////////////////////////////

//First function that runs on a brush move
  function brushmove () {

    let extent = brush.extent()

    //Reset the part that is visible on the big chart
    let originalRange = main_yZoom.range()
    main_yZoom.domain(extent)

    /////////////////////////////////////////////////////////////
    ///////////////////// Update the axis ///////////////////////
    /////////////////////////////////////////////////////////////

    //Update the domain of the x & y scale of the big bar chart
    main_yScale.domain(data.map(function (d) { return d.country }))
    main_yScale.rangeBands([main_yZoom(originalRange[0]), main_yZoom(originalRange[1])], 0.4, 0)

    //Update the y axis of the big chart
    d3.select('.mainGroupBids')
      .select('.y.axis')
      .call(main_yAxis)

    /////////////////////////////////////////////////////////////
    /////////////// Update the mini bar fills ///////////////////
    /////////////////////////////////////////////////////////////

    //Update the colors within the mini bar chart
    let selected = mini_yScale.domain()
      .filter(function (d) { return (extent[0] - mini_yScale.rangeBand() + 1e-2 <= mini_yScale(d)) && (mini_yScale(d) <= extent[1] - 1e-2) })
    //Update the colors of the mini chart - Make everything outside the brush grey
    d3.select('.miniGroupBids').selectAll('.bar')
      .style('fill', function (d, i) { return selected.indexOf(d.country) > -1 ? 'url(#gradient-rainbow-mini)' : '#e0e0e0' })

    //Update the label size
    d3.selectAll('.y.axis text')
      .style('font-size', textScale(selected.length))

    //Update the big bar chart
    update()

  }//brushmove

/////////////////////////////////////////////////////////////
////////////////////// Click functions //////////////////////
/////////////////////////////////////////////////////////////

//Based on http://bl.ocks.org/mbostock/6498000
//What to do when the user clicks on another location along the brushable bar chart
  function brushcenter () {
    let target = d3.event.target,
      extent = brush.extent(),
      size = extent[1] - extent[0],
      range = mini_yScale.range(),
      y0 = d3.min(range) + size / 2,
      y1 = d3.max(range) + mini_yScale.rangeBand() - size / 2,
      center = Math.max(y0, Math.min(y1, d3.mouse(target)[1]))

    d3.event.stopPropagation()

    gBrush
      .call(brush.extent([center - size / 2, center + size / 2]))
      .call(brush.event)

  }//brushcenter

/////////////////////////////////////////////////////////////
///////////////////// Scroll functions //////////////////////
/////////////////////////////////////////////////////////////

  function scroll () {

    //Mouse scroll on the mini chart
    let extent = brush.extent(),
      size = extent[1] - extent[0],
      range = mini_yScale.range(),
      y0 = d3.min(range),
      y1 = d3.max(range) + mini_yScale.rangeBand(),
      dy = d3.event.deltaY,
      topSection

    if (extent[0] - dy < y0) { topSection = y0 }
    else if (extent[1] - dy > y1) { topSection = y1 - size }
    else { topSection = extent[0] - dy }

    //Make sure the page doesn't scroll as well
    d3.event.stopPropagation()
    d3.event.preventDefault()

    gBrush
      .call(brush.extent([topSection, topSection + size]))
      .call(brush.event)

  }//scroll

/////////////////////////////////////////////////////////////
///////////////////// Helper functions //////////////////////
/////////////////////////////////////////////////////////////

//Create a gradient
  function createGradient (idName, endPerc) {

    let coloursRainbow = ['#6495ED']

    defs.append('linearGradient')
      .attr('id', idName)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', endPerc).attr('y2', '0%')
      .selectAll('stop')
      .data(coloursRainbow)
      .enter().append('stop')
      .attr('offset', function (d, i) { return i / (coloursRainbow.length - 1) })
      .attr('stop-color', function (d) { return d })
  }//createGradient

//Function to generate random strings of 5 letters - for the demo only
  function makeWord () {
    let possible_UC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let text = possible_UC.charAt(Math.floor(Math.random() * possible_UC.length))

    let possible_LC = 'abcdefghijklmnopqrstuvwxyz'

    for (let i = 0; i < 5; i++)
      text += possible_LC.charAt(Math.floor(Math.random() * possible_LC.length))

    return text
  }//makeWord
}