/**
 * This script was developed by Guberni and is part of Tellki's Monitoring Solution
 *
 * July, 2015
 * 
 * Version 1.0
 * 
 * DESCRIPTION: Monitor ActiveMQ Availability
 *
 * SYNTAX: node activemq_availability_monitor.js <METRIC_STATE> <HOST> <PORT> <USERNAME> <PASSWORD>
 * 
 * EXAMPLE: node activemq_availability_monitor.js "1,1" "10.10.2.5" "61613" "username" "password"
 *
 * README:
 *    <METRIC_STATE> is generated internally by Tellki and it's only used by Tellki default monitors: 1 - metric is on; 0 - metric is off
 *    <HOST> ActiveMQ ip address or hostname
 *    <PORT> ActiveMQ service port
 *    <USERNAME> ActiveMQ username
 *    <PASSWORD> ActiveMQ password
 */

var stomp = require('stomp-client');
 
/**
 * Metrics.
 */
var metrics = [];
metrics['Status'] =       { id: '1767:Status:9' };
metrics['ResponseTime'] = { id: '1768:Response Time:4' };
 
var inputLength = 5;
 
/**
 * Entry point.
 */
(function() {
  try
  {
    monitorInput(process.argv);
  }
  catch(err)
  { 
    if(err instanceof InvalidParametersNumberError)
    {
      console.log(err.message);
      process.exit(err.code);
    }
    else if(err instanceof UnknownHostError)
    {
      console.log(err.message);
      process.exit(err.code);
    }
    else
    {
      console.log(err.message);
      process.exit(1);
    }
  }
}).call(this);

// ############################################################################
// PARSE INPUT

/**
 * Verify number of passed arguments into the script, process the passed arguments and send them to monitor execution.
 * Receive: arguments to be processed
 */
function monitorInput(args)
{
  args = args.slice(2);
  if(args.length != inputLength)
    throw new InvalidParametersNumberError();
  
  //<METRIC_STATE>
  var metricState = args[0].replace('"', '');
  var tokens = metricState.split(',');
  var metricsExecution = new Array();
  for(var i in tokens)
    metricsExecution[i] = (tokens[i] === '1');
  
  //<HOST> 
  var hostname = args[1];
  
  //<PORT> 
  var port = args[2];
  if (port.length === 0)
    port = '61613';

  // <USER_NAME>
  var username = args[3];
  username = username.length === 0 ? '' : username;
  username = username === '\"\"' ? '' : username;
  if(username.length === 1 && username === '\"')
    username = '';
  
  // <PASS_WORD>
  var passwd = args[4];
  passwd = passwd.length === 0 ? '' : passwd;
  passwd = passwd === '\"\"' ? '' : passwd;
  if(passwd.length === 1 && passwd === '\"')
    passwd = '';
  
  if(username === '{0}')
    username = passwd = '';

  // Create request object to be executed.
  var request = new Object()
  request.checkMetrics = metricsExecution;
  request.hostname = hostname;
  request.port = port;
  request.username = username;
  request.passwd = passwd;
  
  // Get metrics.
  processRequest(request);
}

// ############################################################################
// GET METRICS

/**
 * Retrieve metrics information
 * Receive: object request containing configuration
 */
function processRequest(request) 
{
  var client;

  if (request.username !== '')
    client = new stomp(request.hostname, request.port, request.username, request.passwd);
  else
    client = new stomp(request.hostname, request.port);
  
  var metricsObj = [];
  var ts = new Date();

  client.connect(function(sessionId) {
    ts = (new Date()) - ts;

    // Status
    if (request.checkMetrics[0])
    {
      var metric = new Object();
      metric.id = metrics['Status'].id;
      metric.val = '1';
      metricsObj.push(metric);
    }

    // Response time
    if (request.checkMetrics[1])
    {
      var metric = new Object();
      metric.id = metrics['ResponseTime'].id;
      metric.val = ts;
      metricsObj.push(metric);
    }

    // Output
    output(metricsObj);

    client.disconnect(function() {
      process.exit(0);
    });
  },
  function (e) {
    if(e.code === 'ENOTFOUND')
    {
      errorHandler(new UnknownHostError());
    }
    else
    {
      // Status
      if (request.checkMetrics[0])
      {
        var metric = new Object();
        metric.id = metrics['Status'].id;
        metric.val = '0';
        metricsObj.push(metric);
      }

      // Output
      output(metricsObj);
    }
  });
}

// ############################################################################
// OUTPUT METRICS

/**
 * Send metrics to console
 * Receive: metrics list to output
 */
function output(metrics)
{
  for (var i in metrics)
  {
    var out = '';
    var metric = metrics[i];
    
    out += metric.id;
    out += '|';
    out += metric.val;
    out += '|';
    
    console.log(out);
  }
}

// ############################################################################
// ERROR HANDLER

/**
 * Used to handle errors of async functions
 * Receive: Error/Exception
 */
function errorHandler(err)
{
  if(err instanceof UnknownHostError)
  {
    console.log(err.message);
    process.exit(err.code);
  }
  else if (err instanceof MetricNotFoundError)
  {
    console.log(err.message);
    process.exit(err.code);   
  }
  else
  {
    console.log(err.message);
    process.exit(1);
  }
}

// ############################################################################
// EXCEPTIONS

/**
 * Exceptions used in this script.
 */
function InvalidParametersNumberError() {
    this.name = 'InvalidParametersNumberError';
    this.message = 'Wrong number of parameters.';
  this.code = 3;
}
InvalidParametersNumberError.prototype = Object.create(Error.prototype);
InvalidParametersNumberError.prototype.constructor = InvalidParametersNumberError;

function UnknownHostError() {
    this.name = 'UnknownHostError';
    this.message = 'Unknown host.';
  this.code = 28;
}
UnknownHostError.prototype = Object.create(Error.prototype);
UnknownHostError.prototype.constructor = UnknownHostError;

function MetricNotFoundError() {
    this.name = 'MetricNotFoundError';
    this.message = '';
  this.code = 8;
}
MetricNotFoundError.prototype = Object.create(Error.prototype);
MetricNotFoundError.prototype.constructor = MetricNotFoundError;