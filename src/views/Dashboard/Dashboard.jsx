import React ,{Component}from "react";
import PropTypes from "prop-types";
// react plugin for creating charts
import ChartistGraph from "react-chartist";
// @material-ui/core
import withStyles from "@material-ui/core/styles/withStyles";
import Icon from "@material-ui/core/Icon";
// @material-ui/icons
import DateRange from "@material-ui/icons/DateRange";
import AccessTime from "@material-ui/icons/AccessTime";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardIcon from "components/Card/CardIcon.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

// 引入 ECharts 主模块
import echarts from 'echarts/lib/echarts';
// 引入柱状图
import  'echarts/lib/chart/pie';
import  'echarts/lib/chart/line';
import  'echarts/lib/component/markLine';
import  'echarts/lib/component/markPoint';
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';

import {
  emailsSubscriptionChart,
} from "variables/charts.jsx";

import dashboardStyle from "assets/jss/material-dashboard-react/views/dashboardStyle.jsx";
import { Link } from 'react-router-dom';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import green from '@material-ui/core/colors/green';

function getDateString(){
  var currentDate = new Date();//yesterday
  var lastDate = new Date(currentDate.getTime() - 24*60*60*1000)
  var dateString = lastDate.toLocaleDateString();
  var dateCom = dateString.split('/');
  if(dateCom[1].length < 2){
    dateCom[1] = '0'+dateCom[1]
  }
  if(dateCom[2].length < 2){

    dateCom[2] = '0'+dateCom[2]
  }
  dateString = dateCom[0]+'-'+dateCom[1]+'-'+dateCom[2]
  return dateString;
}

let Software = function(name){  
  var me = this;
  me.name = name;
  me.id = null;
  me.realtimeData = [];
  me.historyData = [];
  me.moduleList = [];
}

Software.prototype = {
  setRealtimeData:function(data){
      var me = this;
      me.realtimeData = data;
  },
  setId:function(id){
    var me = this;
    me.id = id;
  },
  setHistoryData:function(data){
    var me = this;
    me.historyData = data;
  },
  setModules:function(modules){
    var me = this;
    me.moduleList = modules;
  }
};

async function getSoftwares(threshold){
  console.log("getSoftwares In")
  let res = await fetch("http://192.168.127.1:5000/server", {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
  })
  let result = await res.json();
  let softwareList = [];
  for (let i in result){
    let software = new Software(result[i].software);
    software.setId(result[i]._id.$oid);
    let realtimeData = await getRealtime(software.id);
    let moduleList = [];
    for(let j in realtimeData){
      if(Number(realtimeData[j].use) >= Number(threshold)){
        moduleList.push(j);
      }
    }
    console.log("threshold, moduleList", threshold, moduleList)
    software.setRealtimeData(realtimeData);
    software.setModules(moduleList);
    softwareList.push(software);
  } 
  console.log("softwareList:",softwareList)
  return softwareList;
}

async function getRealtime (id){
  let path = "http://192.168.127.1:5000/realtime?server_id="+id
  let res = await fetch(path, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
  })
  let result = await res.json();
  return result;
}

class Dashboard extends Component {
  constructor(props){
    super(props);
    this.state = {
      msg: "",
      value: 0,
      chart_msg : {},
      softwareList: [],
      hisMsg: [],
      domain:"",
      port:0,
      software:"",
      open:false,
      threshold: 5,
    };
    this.initState(this.state.threshold);
  }

  handleChangeIndex = index => {
    this.setState({ value: index });
  };

  initState = (threshold) => {
    getSoftwares(threshold)
      .then(
        (result) => {
            this.setState({
            softwareList : result,
          })
        }
      )
  }

  componentDidMount() {
    let dateString = getDateString();
    let path = "http://192.168.127.1:5000/history?software=matlab&module=MATLAB&date="+dateString+"&server_id=5dba4e48788e8d2168e190c6"
    console.log("Getting History Data")
    fetch(path, {
      method: 'GET',
      credentials: 'include',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
    })
      .then(
        res => res.json()
      )
      .then(
        (result) => {
          console.log("History Data:", result)
          let realHisMsg = []
          for(let index in result){
            realHisMsg.push(result[index].use)
          }
          this.setState({
            hisMsg : realHisMsg
          })
        }
      )
  }

  handleChangeDomain = (event) => {
    this.setState({
      domain:event.target.value
    })
  }

  handleChangePort = (event) =>{
    this.setState({
      port:event.target.value
    })
  }

  handleChangeSoftware = (event) =>{
    this.setState({
      software:event.target.value
    })
  }

  handleChangeThreshold = (event) =>{
    this.setState({
      threshold:event.target.value
    })
  }

  handleSetThreshold = () =>{
    console.log("threshold:",this.state.threshold)
    getSoftwares(this.state.threshold)
      .then(
        (result) => {
            this.setState({
            softwareList : result,
          })
        }
      )
  }

  handleSubmit = () =>{
    let msg = {}
    msg.domain=this.state.domain
    msg.port=this.state.port
    msg.software=this.state.software
    msg.lic="lic-sjtu-"+this.state.software+".dat"
    console.log(msg)
    fetch("http://192.168.127.1:5000/server", {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(msg)
        })
            .then(
              res => res.json()
              )
              .then(
                (result) => {
                  console.log(result)
                  if(result._id !== null){
                    this.setOpen(true);
                    window.location.reload()
                  }
                }
              )
  }

  handleClose= (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setOpen(false);
  }

  setOpen = (value) => {
    this.setState({
      open:value
    })
  }


  render() {
    let msg = this.state.softwareList;
    console.log("softwareList:", msg)
    if(msg.length !== 0){
      console.log("1st module:", msg[0].realtimeData[msg[0].moduleList[0]])
    }

    var new_chart_options = emailsSubscriptionChart.options
    if(Object.keys(this.state.chart_msg).length != 0){
      new_chart_options["high"] = Math.max.apply(Math,this.state.chart_msg["series"][0])*1.5
    }
    const { classes } = this.props;
    return (
      <div>
        <GridContainer spacing={3}>
        <Snackbar
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            open={this.state.open}
            autoHideDuration={6000}
            onClose={this.handleClose}
            ContentProps={{
              'aria-describedby': 'message-id',
            }}
            message="Software Server Successfully Added"
            action={[
              <Button key="undo" color="secondary" size="small" onClick={this.handleClose}>
                Close
              </Button>
            ]}
          />
          <GridItem xs={6}><h2>Add New License Server</h2></GridItem>
          <GridItem xs={6}><h2>Set Threshold</h2></GridItem>
            <TextField
            id="domain"
            label="Domain"
            className="domainInput"
            margin="normal"
            variant="outlined"
            style={{marginLeft:"10px"}}
            onChange={this.handleChangeDomain}
            />
            <TextField
            id="port"
            label="Service Port"
            className="portInput"
            margin="normal"
            variant="outlined"
            style={{marginLeft:"20px"}}
            onChange={this.handleChangePort}
            />
            <TextField
            id="software"
            label="Software Name"
            className="softwareInput"
            margin="normal"
            variant="outlined"
            style={{marginLeft:"20px"}}
            onChange={this.handleChangeSoftware}
            />
            <Button variant="contained" onClick={this.handleSubmit} className="submit-button" style={{marginLeft:"20px"}}>
              Add
            </Button>
            <TextField
            id="threshold"
            label="Threshold (default:5)"
            className="thresholdInput"
            margin="normal"
            variant="outlined"
            style={{marginLeft:"20px"}}
            onChange={this.handleChangeThreshold}
            />
            <Button variant="contained" onClick={this.handleSetThreshold} className="threshold-button" style={{marginLeft:"20px"}}>
              Set
            </Button>
        </GridContainer>
        
        <GridContainer>
            {
              msg.map((software)=>{
                return <GridContainer>
                <GridItem xs={12}><h2>{software.name+" modules:"}</h2></GridItem>
                {
                  software.moduleList.map((item)=>{
                    return <GridItem xs={12} sm={6} md={3}>
                    <Card>
                    <CardHeader color="warning" stats icon>
                      <CardIcon color="warning">
                        <Icon>content_copy</Icon>
                      </CardIcon>
                      <p className={classes.cardCategory}>{item}</p>
                      <h3 className={classes.cardTitle}>
                        {msg.length === 0 ? 0+'/'+0 : software.realtimeData[item].use +'/'+software.realtimeData[item].total}
                        <br/>
                        <small>licenses</small>
                      </h3>
                    </CardHeader>
                    <CardFooter stats>
                      <div className={classes.stats}>
                        <DateRange />
                          <div>
                          <Link to={{ 
                            pathname : '/table' ,
                            state : {
                              name: item,
                              userdata: software.realtimeData[item]['user_data']
                              }
                            }}>
                          Check details
                          </Link>
                          </div>
                      </div>
                    </CardFooter>
                  </Card>  
                  </GridItem>  
                  }
                  )
                }
                </GridContainer>

              })
            }
            
        </GridContainer>

        
        
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(dashboardStyle)(Dashboard);
