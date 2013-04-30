/*!
 * hsf - hsf_protocol.cc
 * Copyright(c) 2012 Taobao.com
 * Author: busi.hyy <busi.hyy@taobao.com>
 */

#include <node.h>
#include <v8.h>
#include <node_buffer.h>
#include <typeinfo>
#include <string>
#include <map>
#include <vector>
#include <sstream>
// #include <iostream>
#include "hsf_define.h"
#include "objects.h"
#include "hessian_input.h"
#include "hessian_output.h"
#include "hessian_protoc.h"
#include "hsf_protoc.h"
#include "cs_encode.h"
// #include "json_text.h"

using namespace v8;
using namespace hsf;
using namespace std;
using namespace node;

#define THROW_BAD_ARGS \
  ThrowException(v8::Exception::TypeError(v8::String::New("Bad argument"))); \
  return scope.Close(Undefined())

#define THROW_V8_EXCEPTION(info) \
  ThrowException(v8::Exception::Error(v8::String::New(info))); \
  return scope.Close(Undefined())

#define NEW_NODE_BUFFER(str) \
  Buffer::New(const_cast<char *>((str).c_str()), (str).size())->handle_

// transform method
hsf::Object *v8ToHsf(Handle<Value>, std::vector<Handle<Value> >, string &, const bool&);
Handle<Value> hsfToV8(hsf::Object *, std::vector<hsf::Object *>, std::vector<Handle<Value> > , string &);
hsf::Object *complexV8ToHsf(Handle<v8::Object>, vector<Handle<Value> >, string &, const bool&);

Handle<Value> genReqBody(const Arguments);

//hsf consumer encode && decode
Handle<Value> requestEncode(const Arguments &args);
Handle<Value> responseDecode(const Arguments &args);

//hsf heartbeat encode
Handle<Value> heartbeatEncode(const Arguments &args);

//hsf server method
/**
 * hsf serverice handle
 */
// hsf_provider_service *service;
Handle<Value> requestDecode(const Arguments &args);
Handle<Value> responseEncode(const Arguments &args);

Handle<Value> cs_regist_encode(const Arguments &args);
Handle<Value> cs_publish_encode(const Arguments &args);
Handle<Value> cs_do_publish_encode(const Arguments &args);

// Handle<Value> hsfInit(const Arguments &args);
// Handle<Value> hsfRegistService(const Arguments &args);
// Handle<Value> hsfPublish(const Arguments &args);
// Handle<Value> hsfDestroy(const Arguments &args);

/**
 * generat request body for config server
 */
Handle<Value> genReqBody(const Arguments &args) {
  HandleScope scope;
  if (args.Length()!=2 && !args[0]->IsString() && !args[1]->IsString()) {
    THROW_BAD_ARGS;
  }

  string data;
  hessian_output hout(&data);
  
  Map command("com.taobao.config.server.common.dataobject.Command");
  command.put("id", (hsf::Object*) NULL);
  command.put("name", "getGroupData");

  List params("[object");
  params.push_back(*v8::String::AsciiValue(args[0]));
  params.push_back(*v8::String::AsciiValue(args[1]));
  command.put("params", &params);

  hout.write_object(&command);
  return scope.Close(NEW_NODE_BUFFER(data));
}

hsf::Object *v8ToHsf(Handle<Value> arg, vector<Handle<Value> > vecVal, string &errmsg, const bool &isArg = false) {
  if (errmsg != "") {
    return NULL;
  }
  hsf::Object *obj = NULL;
  if (arg->IsString()) {
    //string
    obj = new hsf::String((*v8::String::Utf8Value(arg)));
  } else if (arg->IsInt32()) {
    //int
    obj = new hsf::Integer(arg->Int32Value());
  } else if (arg->IsNumber()) {
    //number
    obj = new hsf::Double(arg->NumberValue());
  } else if (arg->IsBoolean()) {
    //boolean
    obj = new hsf::Boolean(arg->BooleanValue());
  } else if (Buffer::HasInstance(arg)) {
    //buffer
    obj = new ByteArray(Buffer::Data(arg->ToObject()), Buffer::Length(arg->ToObject()));
  } else if (arg->IsArray()) {
    //array
    for (uint32_t i = 0; i != vecVal.size(); i++) {
      if (arg->Equals(vecVal[i])) {
        errmsg = "Converting circular structure error!";
        return obj;
      }
    }
    vecVal.push_back(arg);
    List* list = new hsf::List();
    Handle<v8::Object> v8Obj = arg->ToObject();
    uint32_t  len = v8Obj->GetOwnPropertyNames()->Length();
    for (uint32_t i = 0; i != len; ++i) {
      list->push_back(v8ToHsf(v8Obj->Get(i), vecVal, errmsg), true);
    }
    obj = (hsf::Object *)list;
  } else if (arg->IsDate()) {
    //date
    obj = new hsf::Date((int64_t)v8::Date::Cast(*arg->ToObject())->NumberValue());
  } else if (arg->IsObject()) {
    //object
    for (uint32_t i = 0; i != vecVal.size(); i++) {
      if (arg->Equals(vecVal[i])) {
        errmsg = "Converting circular structure error!";
        return obj;
      }
    }
    vecVal.push_back(arg);
    Handle<v8::Object> v8Obj = arg->ToObject();
    if (v8Obj->Has(v8::String::New("$")) && v8Obj->Has(v8::String::New("$class"))) {
      if (!v8Obj->Get(v8::String::New("$class"))->IsString()) {
        errmsg = "$class must be type of String!";
        return NULL;
      }
      if (v8Obj->Has(v8::String::New("$abstractClass")) && !v8Obj->Get(v8::String::New("$abstractClass"))->IsString()) {
        errmsg = "$abstractClass must be type of String!";
        return NULL;
      }
      return complexV8ToHsf(v8Obj, vecVal, errmsg, isArg);
    }
    Handle<Array> keys = v8Obj->GetOwnPropertyNames();
    uint32_t len = keys->Length();
    Map* map = new hsf::Map();
    for (uint32_t i = 0; i != len; ++i) {
      map->put(*v8::String::Utf8Value(keys->Get(i)), v8ToHsf(v8Obj->Get(keys->Get(i)), vecVal, errmsg), true, true);
    }
    obj = (hsf::Object *)map;
  } else if(arg->IsNull() || arg->IsUndefined()){
    obj = new NullObject();
  } else {
    errmsg = "Yet not support this kind of struct!";
  }
  return obj;
}

hsf::Object *complexV8ToHsf(Handle<v8::Object> v8Obj, vector<Handle<Value> > vecVal, string &errmsg, const bool &isArg = false) {
  if (errmsg != "") {
    return NULL;
  }
  string className = *v8::String::AsciiValue(v8Obj->Get(v8::String::New("$class")));
  if (className.size() < 2) {
    errmsg = "$class must have a size bigger than 1";
    return NULL;
  }
  Handle<v8::Value> data = v8Obj->Get(v8::String::New("$"));
  if (data->IsObject()) {
    for (uint32_t i = 0; i != vecVal.size(); i++) {
      if (data->Equals(vecVal[i])) {
        errmsg = "Converting circular structure error!";
        return NULL;
      }
    }
    vecVal.push_back(data);
  }

  //long
  if (className == "java.lang.Long" || className == "long") {
    if (!data->IsNumber()) {
      errmsg = "java.lang.Long or long should be typeof Number!";
      return NULL;
    }
    return new hsf::Long((int64_t)data->NumberValue(), className);
  }
  //int short byte
  if (className == "java.lang.Short" || className == "short" ||
      className == "java.lang.Integer" || className == "int" ||
      className == "java.lang.Byte" || className == "byte") {
    if (!data->IsInt32()) {
      errmsg = "integer short byte should be typeof Integer!";
      return NULL;
    }
    return new hsf::Integer(data->Int32Value(), className);
  }
  //bool
  if (className == "java.lang.Boolean" || className == "boolean") {
    if (!data->IsBoolean()) {
      errmsg = "boolean must be typeof Boolean!";
      return NULL;
    }
    return new hsf::Boolean(data->BooleanValue(), className);
  }
  //float
  if (className == "double" || className == "java.lang.Double" ||
      className == "float" || className == "java.lang.Float") {
    if (!data->IsNumber()) {
      errmsg = "float/double must be typeof Number!";
      return NULL;
    }
    return new hsf::Double(data->NumberValue(), className);
  }
  //string
  if (className == "java.lang.String" || className == "char" || 
    className == "char[]" || className == "java.lang.Character") {
    if (!data->IsString()) {
      errmsg = "Character/String must be typeof String!";
      return NULL;
    }
    return new hsf::String(*v8::String::Utf8Value(data), className);
  }
  if (className == "java.util.ArrayList" || className == "java.util.List" ||
      className == "java.util.Set" || className == "java.util.Set" ||
      className == "java.util.Iterator" || className == "java.util.Enumeration") {
    if (!data->IsArray()) {
      errmsg = "Java List must be typeof Array!";
      return NULL;
    }
    List* list = new hsf::List(className);
    Handle<v8::Object> obj = data->ToObject();
    uint32_t  len = obj->GetOwnPropertyNames()->Length();
    for (uint32_t i = 0; i != len; ++i) {
      list->push_back(v8ToHsf(obj->Get(i), vecVal, errmsg), true);
    }
    return list;
  }
  //array
  if (className[0] == '[') {
    if (!data->IsArray()) {
      errmsg = "Java List must be typeof Array!";
      return NULL;
    }

    Handle<v8::Object> obj = data->ToObject();
    uint32_t  len = obj->GetOwnPropertyNames()->Length();
    Handle<v8::String> ckey = v8::String::New("$class");
    Handle<v8::String> vkey = v8::String::New("$");
    Handle<v8::String> cname;
    if (className == "[string") {
      cname = v8::String::New("java.lang.String");
    } else if (className == "[object") {
      cname = v8::String::New("java.lang.Object");
    } else {
      cname = v8::String::New(className.substr(1, className.size() - 1).c_str());
    }
    //如果是作为HSF服务的直接参数，数组需要表示成java的类名
    if (isArg) {
      if (className == "[short") {
        className = "[S";
      } else if (className == "[int") {
        className = "[I";
      } else if (className == "[boolean") {
        className = "[Z";
      } else if (className == "[double") {
        className = "[D";
      }  else if (className == "[long") {
        className = "[J";
      }  else if (className == "[float") {
        className = "[F";
      } else if (className == "[string") {
        className = "[Ljava.utils.String";
      } else if (className == "[object") {
        className = "[Ljava.utils.Object";
      } else {
        className = "[L" + className.substr(1, className.size() - 1) + ";";
      }
    }
    hsf::List* list = new hsf::List(className);
    for (uint32_t i = 0; i != len; ++i) {
      Handle<v8::Object> item = v8::Object::New();
      item->Set(ckey, cname);
      item->Set(vkey, obj->Get(i));
      list->push_back(v8ToHsf(item, vecVal, errmsg), true);
    }
    return list;
  }
  // else are map
  if (!data->IsObject()) {
    errmsg = "Java Object must be typeof Object!";
    return NULL;
  }
  hsf::Map *map = new Map(className);
  Handle<v8::Object> obj = data->ToObject();
  Handle<Array> keys = obj->GetOwnPropertyNames();
  uint32_t len = keys->Length();
  for (uint32_t i = 0; i != len; ++i) {
    map->put(*v8::String::Utf8Value(keys->Get(i)), v8ToHsf(obj->Get(keys->Get(i)), vecVal, errmsg), true, true);
  }
  if (v8Obj->Has(v8::String::New("$abstractClass"))) {
    return new hsf::Reference(map, *v8::String::AsciiValue(v8Obj->Get(v8::String::New("$abstractClass"))), true);
  } else {
    return map;
  }
}

Handle<Value> hsfToV8(hsf::Object *obj, std::vector<hsf::Object *> vecHsfVal, std::vector<Handle<Value> > vecV8Val, string &errmsg) {
  HandleScope scope;
  Handle<Value> result = v8::Null();
  // bool isObject = false;
  if (errmsg != "") {
    return v8::Null();
  }
  // 基本类型
  if (instance_of<hsf::List> (obj)) {
    for (uint32_t i = 0; i != vecHsfVal.size(); i++) {
      if (obj == vecHsfVal[i]) {
        //errmsg = "Converting circular structure error!";
        return vecV8Val[i];
      }
    }
    vecHsfVal.push_back(obj);
    List *list = obj->to_list();
    uint32_t length = list->size();
    Handle<v8::Array> v8Arr = v8::Array::New(length);
    vecV8Val.push_back(v8Arr);
    for (uint32_t i = 0; i != length; ++i) {
      v8Arr->Set(i, hsfToV8(list->get(i), vecHsfVal, vecV8Val, errmsg));
    }
    result = v8Arr;
  } else if(instance_of<hsf::String>(obj)) {
    result = v8::String::New(obj->to_string().c_str());
  } else if (instance_of<hsf::Boolean>(obj)) {
    result = v8::Boolean::New(obj->to_bool());
  } else if (instance_of<hsf::Integer>(obj)) {
    result = v8::Integer::New(obj->to_int());
  } else if (instance_of<hsf::Double>(obj)) {
    result = v8::Number::New(obj->to_double());
  }  else if (instance_of<hsf::Long>(obj)) {
    result = v8::Number::New(static_cast<double>(obj->to_long()));
  } else if (obj == NULL) {
    result = v8::Null();
  } else if (instance_of<hsf::Exception> (obj)) {
    hsf::Exception *ex = static_cast<hsf::Exception*>(obj);
    const string message = ex->detail_message();
    result = v8::Exception::Error(v8::String::New(message.c_str()));
    string traces = "";
    for (vector<hsf::Object*>::const_iterator it = ex->stack_trace()->data().begin();
          it != ex->stack_trace()->data().end(); ++it) {
      traces += (*it)->to_string() + '\n';
    }
    result->ToObject()->Set(v8::String::NewSymbol("javaTrace"), v8::String::New(traces.c_str()));
  } else if (instance_of<hsf::Date> (obj)) {
    result = v8::Date::New((static_cast<hsf::Date *>(obj))->data());
  } else if (instance_of<hsf::ByteArray> (obj)) {
    string buf = static_cast<hsf::ByteArray *>(obj)->data();
    result = NEW_NODE_BUFFER(buf);
  }
  else if (instance_of<hsf::Map> (obj)) {
    for (uint32_t i = 0; i != vecHsfVal.size(); i++) {
      if (obj == vecHsfVal[i]) {
        //errmsg = "Converting circular structure error!";
        return vecV8Val[i];
      }
    }
    vecHsfVal.push_back(obj);
    Handle<v8::Object> v8Obj = v8::Object::New();
    vecV8Val.push_back(v8Obj);
    const Map::data_type& data = obj->to_map()->data();
    uint32_t j = 0;
    for (Map::data_type::const_iterator it = data.begin(); it != data.end(); ++it, ++j) {
      hsf::Object* key = (*it).first;
      hsf::Object* val = (*it).second;
      if (instance_of<hsf::String>(key)) {
        v8Obj->Set(v8::String::NewSymbol(key->to_string().c_str()), hsfToV8(val, vecHsfVal, vecV8Val, errmsg));
      } else {
        v8Obj->Set(v8::String::NewSymbol("key_" + j), hsfToV8(val, vecHsfVal, vecV8Val, errmsg));
      }
    }
    result = v8Obj;
  } else {
    errmsg = "Yet not support this kind of struct!";
    return v8::Null();
  }
  return scope.Close(result);
}

/**
 * encode request for hsf server
 */
Handle<Value> requestEncode(const Arguments &args) {
  HandleScope scope;

  string method_name(*v8::String::AsciiValue(args[1]));
  string service_signature(*v8::String::AsciiValue(args[0]));

  hsf_request_object hsf_req;
  hsf_req.packet_id = (uint64_t)args[2]->ToInteger()->Value();
  hsf_req.protocol = HESSIAN;
  hsf_req.service_signature = &service_signature;
  hsf_req.method_name = &method_name;
  List hsfArgs;
  if(args.Length()>=4) {
    Array* arr = Array::Cast(*(args[3]->ToObject()));
    unsigned len = arr->Length();
    for (unsigned i=0; i!=len; ++i) {
      std::vector<Handle<Value> > vecVal;
      string errmsg = "";
      hsf::Object *arg = v8ToHsf(arr->Get(i), vecVal, errmsg, true);
      hsfArgs.push_back(arg);
      if (errmsg != "") {
        unsigned hsfLen = hsfArgs.size();
        for (unsigned j = 0; j != hsfLen; ++j) {
          if (hsfArgs[j]) {
            delete hsfArgs[j];
          }
        }
        THROW_V8_EXCEPTION(errmsg.c_str());
      }
    }
  }
  hsf_req.method_args = &hsfArgs;
   // printf("%s\n", hsfArgs.debug_text().c_str());
  string output;
  hsf_request_encode(hsf_req, output);
  Handle<Value> res = NEW_NODE_BUFFER(output);
  unsigned hsfLen = hsfArgs.size();
  for (unsigned j = 0; j != hsfLen; ++j) {
    if (hsfArgs[j]) {
      delete hsfArgs[j];
    }
  }  
  return scope.Close(res);
}

Handle<Value> heartbeatEncode(const Arguments &args) {
  HandleScope scope;
  uint64_t packetId = (uint64_t)args[0]->ToInteger()->Value();
  string output;
  hsf_request_heartbeat_encode(packetId, output);
  Handle<Value> res = NEW_NODE_BUFFER(output);
  return scope.Close(res);
}

Handle<Value> responseDecode(const Arguments &args) {
  HandleScope scope;
  Local<Value> arg = args[0];
  if(!Buffer::HasInstance(arg)) {
    THROW_V8_EXCEPTION("Decode Response Error: Input must be buffer type!");
  }
  size_t size = Buffer::Length(arg->ToObject());
  char *buf = Buffer::Data(arg->ToObject());
  hsf_response_object output;
  const char * t = hsf_response_decode(buf, size, output);
  if (t == NULL) {
    THROW_V8_EXCEPTION("Decode Response Error: decode buffer error!");
  }
  Local<v8::Object> res = v8::Object::New();
  if (output.type == HEARTBEAT) {
    res->Set(v8::String::NewSymbol("packetType"), v8::String::New("HEARTBEAT"));
  } else {
    res->Set(v8::String::NewSymbol("packetType"), v8::String::New("HSF"));
    res->Set(v8::String::NewSymbol("packetId"), v8::Number::New(output.packet_id));
    res->Set(v8::String::NewSymbol("isError"), v8::Boolean::New(output.error_msg != NULL));
    if (output.error_msg != NULL) {
      res->Set(v8::String::NewSymbol("errorMsg"), v8::String::New(output.error_msg->c_str()));
    }
    string errmsg = "";
    std::vector<hsf::Object *> vecHsfVal;
    std::vector<Handle<Value> > vecV8Val;
    //fprintf(stdout, "app_obj:\n%s\n", output.method_ret->debug_text().c_str());
    res->Set(v8::String::NewSymbol("appResponse"), hsfToV8(output.method_ret, vecHsfVal, vecV8Val, errmsg));
    if (output.method_ret) delete output.method_ret;
    if (output.error_msg) delete output.error_msg;
    if (errmsg != "") {
      THROW_V8_EXCEPTION(errmsg.c_str());
    }
  }
  return scope.Close(res);
}



/**
 * analysis hsf I/O buffer
 * get an string of json
 */
Handle<Value> requestDecode(const Arguments &args) {
  HandleScope scope;
  Local<Value> arg = args[0];
  if(!Buffer::HasInstance(arg)) {
    THROW_V8_EXCEPTION("Decode Request Error: Input must be buffer type!");
  }
  size_t size = Buffer::Length(arg->ToObject());
  char *buf = Buffer::Data(arg->ToObject());
  hsf_request_object reqObj;
  const char *res = hsf_request_decode(buf, size, reqObj);
  if (res == NULL) {
    THROW_V8_EXCEPTION("Decode Request Error: decode buffer error!");
  }
  Handle<v8::Object> result = v8::Object::New();
  result->Set(v8::String::NewSymbol("packetId"), v8::Number::New(reqObj.packet_id));
  
  if (reqObj.type == HEARTBEAT) {
    result->Set(v8::String::NewSymbol("packetType"), v8::String::New("HEARTBEAT"));
  } else {
    List *realargs = reqObj.method_args;
    result->Set(v8::String::NewSymbol("packetType"), v8::String::New("HSF"));
    result->Set(v8::String::NewSymbol("methodName"), v8::String::New(reqObj.method_name->c_str()));
    std::vector<hsf::Object *> vecHsfVal;
    std::vector<Handle<Value> > vecV8Val;
    string errmsg = "";
    result->Set(v8::String::NewSymbol("args"), hsfToV8(realargs, vecHsfVal, vecV8Val, errmsg));
    // fprintf(stdout, "app_obj:\n%s\n", realargs->debug_text().c_str());
    if (reqObj.method_args) delete reqObj.method_args;
    if (reqObj.method_name) delete reqObj.method_name;
    if (reqObj.service_signature) delete reqObj.service_signature;
    if (errmsg != "") {
      THROW_V8_EXCEPTION(errmsg.c_str());
    }
  }
  return scope.Close(result);
}



Handle<Value> responseEncode(const Arguments &args) {
  HandleScope scope;
  int64_t packetId = args[0]->ToInteger()->Value();
  string *errorMsg = NULL;
  if (args[2]->IsUndefined() || args[2]->IsNull()) {
    errorMsg = NULL;
  } else {
    errorMsg = new string(*v8::String::Utf8Value(args[2]));
  }
  //set hsf_response object
  hsf_response_object hsf_resp;
  hsf_resp.error_msg = errorMsg;
  hsf_resp.packet_id = packetId;
  hsf_resp.protocol = HESSIAN;
  hsf_resp.type = HSF;
  std::vector<Handle<Value> > vecVal;
  string errmsg = "";
  hsf::Object *response = v8ToHsf(args[1], vecVal, errmsg);
  if (errmsg != "") {
    if (response) {
      delete response;
    }
    THROW_V8_EXCEPTION(errmsg.c_str());
  }
  hsf_resp.method_ret = response;
  string output;
  hsf_response_encode(hsf_resp, output);
  if(hsf_resp.method_ret) {
    delete hsf_resp.method_ret;
  }
  if (hsf_resp.error_msg) {
    delete hsf_resp.error_msg;
  }
  Handle<Value> res = NEW_NODE_BUFFER(output);
  return scope.Close(res);
}

Handle<Value> regist_encode(const Arguments& args) {
  HandleScope scope;
  cs_register_object regObj;
  regObj.client_id = *v8::String::Utf8Value(args[0]);
  regObj.data_id = *v8::String::Utf8Value(args[1]);
  regObj.group = *v8::String::Utf8Value(args[2]);
  regObj.addr = *v8::String::Utf8Value(args[3]);
  string output;
  cs_register_encode(regObj, output);
  Handle<Value> res = NEW_NODE_BUFFER(output);
  return scope.Close(res);
}

Handle<Value> publish_encode(const Arguments& args) {
  HandleScope scope;
  cs_publish_object pubObj;
  pubObj.client_id = *v8::String::Utf8Value(args[0]);
  pubObj.data_id = *v8::String::Utf8Value(args[1]);
  pubObj.data = *v8::String::Utf8Value(args[2]);
  pubObj.revision = args[3]->Int32Value();
  string output;
  cs_publish_encode(pubObj, output);
  Handle<Value> res = NEW_NODE_BUFFER(output);
  return scope.Close(res);
}

Handle<Value> do_publish_encode(const Arguments& args) {
  HandleScope scope;
  Array* arr = Array::Cast(*(args[0]->ToObject()));
  std::vector<string> pubBufs;
  unsigned len = arr->Length();
  size_t size;
  const char *buf = NULL;
  for (unsigned i=0; i!=len; ++i) {
    size = Buffer::Length(arr->Get(i)->ToObject());
    buf = Buffer::Data(arr->Get(i)->ToObject());
    pubBufs.push_back(string(buf, size));
  }
  string output;
  cs_do_publish_encode(pubBufs, output);
  Handle<Value> res = NEW_NODE_BUFFER(output);
  return scope.Close(res);
}

void Init(Handle<v8::Object> target) {
  target->Set(v8::String::NewSymbol("genReqBody"),
    FunctionTemplate::New(genReqBody)->GetFunction());

  target->Set(v8::String::NewSymbol("heartbeatEncode"),
    FunctionTemplate::New(heartbeatEncode)->GetFunction());

  target->Set(v8::String::NewSymbol("requestEncode"),
    FunctionTemplate::New(requestEncode)->GetFunction());

  target->Set(v8::String::NewSymbol("responseDecode"),
    FunctionTemplate::New(responseDecode)->GetFunction());

  target->Set(v8::String::NewSymbol("requestDecode"),
    FunctionTemplate::New(requestDecode)->GetFunction());

  target->Set(v8::String::NewSymbol("responseEncode"),
    FunctionTemplate::New(responseEncode)->GetFunction());

  target->Set(v8::String::NewSymbol("csRegistEncode"),
    FunctionTemplate::New(regist_encode)->GetFunction());

  target->Set(v8::String::NewSymbol("csPublishEncode"),
    FunctionTemplate::New(publish_encode)->GetFunction());

  target->Set(v8::String::NewSymbol("csDoPublishEncode"),
    FunctionTemplate::New(do_publish_encode)->GetFunction());

}

NODE_MODULE(hsfProtocol, Init);
