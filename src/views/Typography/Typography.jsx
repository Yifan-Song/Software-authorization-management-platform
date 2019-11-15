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

const threshold = 5

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

function sortNumber(a, b){
  return b-a
}

function sortChartData(a, b){
  return b.number-a.number
}

let ChartData = function(label, number){  
  var me = this;
  me.label = label;
  me.number = number;
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

async function getSoftwares (){
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
      if(realtimeData[j].use >= threshold){
        moduleList.push(j);
      }
    }
    software.setRealtimeData(realtimeData);
    software.setModules(moduleList);
    softwareList.push(software);
  }
  return softwareList;
}

async function getRealtime (id){
  let path = "http://192.168.127.1:5000/realtime?server_id="+id
  console.log("Getting Realtime Data from "+path)
  let res = await fetch(path, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
  })
  let result = await res.json();
  console.log("Realtime Data:", result)
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
      hisMsg: {},
      domain:"",
      port:0,
      software:"",
      open:false,
    };
    this.initState();
  }

  handleChangeIndex = index => {
    this.setState({ value: index });
  };

  initState = () => {
    getSoftwares()
      .then(
        (result) => {
          let newChartMsg = {}
          let chartDataList = []
          newChartMsg['labels']=[]
          newChartMsg['series']=[]
          for(let index in result){
            let software = result[index]
            for(let subSofware in software["realtimeData"]){
              let chartData = new ChartData(subSofware, Number(software["realtimeData"][subSofware]["use"]));
              chartDataList.push(chartData)
            }
          }
          chartDataList = chartDataList.sort(sortChartData)
          chartDataList = chartDataList.slice(0,9)
          for(let index in chartDataList){
            newChartMsg['labels'].push(chartDataList[index].label)
            newChartMsg['series'].push(chartDataList[index].number)
          }
          newChartMsg['series'] = [newChartMsg['series']]
          this.setState({
            softwareList : result,
            chart_msg: newChartMsg
          })
        }
      )
  }

  componentDidUpdate(){
    let matlabChart = echarts.init(document.getElementById('matlab'));
    matlabChart.setOption({
      title: {
        subtext: 'MATLAB'
    },
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data:['License占用数目']
    },
    toolbox: {
        show: true,
        feature: {
            dataZoom: {
                yAxisIndex: 'none'
            },
            dataView: {readOnly: false},
            magicType: {type: ['line', 'bar']},
            restore: {},
            saveAsImage: {}
        }
    },
    xAxis:  {
        type: 'category',
        axisLabel: {
          formatter: '{value} h'
        },
        boundaryGap: false,
        data: ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23']
    },
    yAxis: {
        type: 'value',
    },
    series: [
        {
            name:'被占用license数目',
            type:'line',
            data: this.state.hisMsg["MATLAB"],
            markPoint: {
                data: [
                    {type: 'max', name: '最大值'},
                    {type: 'min', name: '最小值'}
                ]
            },
            markLine: {
                data: [
                    {type: 'average', name: '平均值'}
                ]
            }
        }
    ]
    });
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
          let matlabHisMsg = []
          for(let index in result){
            matlabHisMsg.push(result[index].use)
          }
          let totalHisMsg = this.state.hisMsg
          totalHisMsg["MATLAB"] = matlabHisMsg
          this.setState({
            hisMsg : totalHisMsg
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
    var new_chart_options = emailsSubscriptionChart.options
    if(Object.keys(this.state.chart_msg).length != 0){
      new_chart_options["high"] = Math.max.apply(Math,this.state.chart_msg["series"][0])*1.5
    }
    const { classes } = this.props;
    return (
      <div>
        {
          msg.length === 0?
          (<div style ={{fontSize:"50px",textAlign:"center",marginBottom:"50px"}}>Loading...</div>):
          (
            <GridContainer>
              <GridItem xs={12} sm={12} md={12}>
                <Card chart>
                  <CardHeader color="warning">
                    <ChartistGraph
                      className="ct-chart"
                      data={this.state.chart_msg}
                      type="Bar"
                      options={new_chart_options}
                      responsiveOptions={emailsSubscriptionChart.responsiveOptions}
                      listener={emailsSubscriptionChart.animation}
                    />
                  </CardHeader>
                  <CardBody>
                    <h4 className={classes.cardTitle}>Software use condition</h4>
                    <p className={classes.cardCategory}>
                      Current Max Use 
                    </p>
                  </CardBody>
                  <CardFooter chart>
                    <div className={classes.stats}>
                      <AccessTime /> Realtime Data
                    </div>
                  </CardFooter>
                </Card>
              </GridItem>

            </GridContainer>
          )
        }

        <GridContainer>
            <GridItem xs={12} sm={12} md={12}>
                <Card chart>
                  <CardHeader color="success">
                    <div id="matlab" style={{ width: 1100, height: 300 }}></div>
                  </CardHeader>
                  <CardBody>
                    <h4 className={classes.cardTitle}>Software use condition</h4>
                    <p className={classes.cardCategory}>
                      Last Day Use Condition
                    </p>
                  </CardBody>
                  <CardFooter chart>
                    <div className={classes.stats}>
                      <AccessTime /> Yesterday's Data
                    </div>
                  </CardFooter>
                </Card>
              </GridItem>
        </GridContainer>
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(dashboardStyle)(Dashboard);
