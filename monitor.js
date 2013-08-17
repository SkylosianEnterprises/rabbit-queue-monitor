var EventSystem = require('rabbit-node-lib');

  var environment = process.env.NODE_ENV || 'testing';
  var replayexchangename = 'cartographer-'+environment+'-replay';
  var internalexchangename = 'cartographer-'+environment+'-internal';
  var originexchangename = 'MantaEventPersist'
  var originqueuename = 'queue-for-cartographer-'+environment+'-origin';
  var internalqueuename = 'queue-for-cartographer-'+environment+'-internal';

var schemaMgr = new EventSystem.SchemaMgr(
  { "schemaSchema": "/home/david/rabbitmq-lib/schemata/JsonSchema.schema"
  , "schemaDirectories": [ "/home/david/rabbitmq-lib/schemata" ]
  } );

var rabbit = new EventSystem.Rabbit( { connection: { url: "amqp://localhost:5672//" } } );


var receiver = new EventSystem.Receiver( 
    { rabbit: rabbit
    , schemaMgr: schemaMgr
    , exchanges:
      [ { name: 'cartographer-testing-replay'
        , type: 'topic'
        , passive: false
        , durable: false
        , autoDelete: true
        , auto_delete: true
        }
      , { name: internalexchangename
        , type: 'topic'
        , passive: false
        , durable: true
        , autoDelete: false
        , auto_delete: false
        }
      , { name: originexchangename
        , type: 'topic'
        , passive: false
        , durable: false
        , autoDelete: false
        , auto_delete: false
        }
      ]
    , queues:
      [ { "name": internalqueuename
        , "bindings":
          [ { "routingKey": '#'
            , "exchange": internalexchangename
            }
          ]
        , "passive": false
        , "durable": false
        , "exclusive": false
        , "autoDelete": true
        , "noDeclare": false
        , "arguments": { }
        , "closeChannelOnUnsubscribe": false
        , "subscribeOptions":
          { "ack": false
          , "prefetchCount": 1
          }
        }
      , { "name": originqueuename
        , "bindings":
          [ { "routingKey": 'persist.#'
            , "exchange": originexchangename
            }
          , { "routingKey": 'reducer.'+environment+'.#'
            , "exchange": replayexchangename
            }
          ]
        , "passive": false
        , "durable": false
        , "exclusive": false
        , "autoDelete": true
        , "noDeclare": false
        , "arguments": { }
        , "closeChannelOnUnsubscribe": false
        , "subscribeOptions":
          { "ack": false
          , "prefetchCount": 1
          }
        }
      ]
    } );

receiver.on("ON_QUEUE_"+internalqueuename, function (message, headers, deliveryInfo) {
  console.log("INTERNAL message:", JSON.stringify(message, 0, 4));
} );

receiver.on("ON_QUEUE_"+originqueuename, function (message, headers, deliveryInfo) {
  console.log("ORIGN message:", JSON.stringify(message, 0, 4));
} );

rabbit.on('Rabbit_Ready', function () { console.log("rabbit connect ready") } );
