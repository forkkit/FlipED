import {push} from "connected-react-router"
import reject from "lodash.reject"

import app from "../client/api"
import {setSnackbar} from "./app"

export const sync = (action, data, service) => (dispatch, getState) => {
  const stateData = getState()[service].data || {}
  const stateQuery = getState()[service].queryResult || {}

  if (stateQuery.data) {
    // ListView tree is loaded.
    const listType = `SERVICES_${service.toUpperCase()}_FIND_FULFILLED`
    const payload = {...stateQuery}
    if (action === "remove") {
      payload.total -= 1
      payload.data = reject(payload.data, data)
    } else if (action === "create") {
      payload.total += 1
      payload.data = payload.data.concat(data)
    } else {
      payload.data[payload.data.findIndex(item => item._id === data._id)] = data
    }
    console.info(`${service.toUpperCase()}::SYNC_LIST_${action.toUpperCase()}`, {data, listType, payload})
    dispatch({type: listType, payload})
  }

  if (stateData._id === data._id) {
    // User is currently viewing the content in Detail View.
    // OR data change is issued recently!
    const dType = `SERVICES_${service.toUpperCase()}_${action.toUpperCase()}_FULFILLED`
    console.info(`${service.toUpperCase()}::SYNC_DETAIL_${action.toUpperCase()}`, {stateData, data})
    if (action === "remove") {
      dispatch(setSnackbar("เนื้อหาที่คุณเข้าชมอยู่ถูกลบออกจากระบบแล้วครับ"))
      dispatch(push("/"))
      dispatch({type: dType, payload: null})
    } else if (action === "patch" || action === "update") {
      dispatch(setSnackbar("มีการแก้ไขเนื้อหาที่คุณกำลังอ่านอยู่ครับ"))
      dispatch({type: dType, payload: data})
    }
  } else if (stateQuery.data) {
    // User is currently viewing the content in List View, not in Detail View.
    // Show DetailView notifications.
    if (action === "remove") {
      dispatch(setSnackbar("มีการลบบางรายการ"))
    } else if (action === "create") {
      dispatch(setSnackbar("มีการเพิ่มรายการเข้ามา"))
    } else {
      dispatch(setSnackbar("มีการแก้ไขรายการ"))
    }
  }
}

export const autoSync = (service, dispatch) => {
  const s = app.service(service)
  s.on("created", e => dispatch(sync("create", e, service)))
  s.on("removed", e => dispatch(sync("remove", e, service)))
  s.on("patched", e => dispatch(sync("patch", e, service)))
  s.on("updated", e => dispatch(sync("update", e, service)))
}
