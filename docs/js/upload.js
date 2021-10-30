{/* <script> */}
// TO DO: cat_dict, wont always same as annoatte.js, change TagSelectorWidget accordingly
// make async all

const imageUploadbaseURL = 'https://annotator.ait.ac.th/api/image';
//const imageUploadbaseURL = 'http://203.159.29.51:5000/api/image';
let upload_dataset_id = 65;
let uploaded_images;
let images_annotations = {};
let uploaded_images_gps = {};
var selected_anno;
const MODEL_URL = 'tfjs/model.json'

async function save_annotations_to_array(i){
  annotations_in_osd = selected_anno.getAnnotations();
  let annotations_in_osd_to_array = []
  images_annotations[i] = annotations_in_osd
  document.getElementById('labelcount_'+String(i)).innerHTML = images_annotations[i].length
  document.getElementById('osd-annoatate').innerHTML = ''
  document.getElementById("osd-annoatate-container").style.display = "none";
  // annotations_in_osd.forEach(annotation => {
  // })
}

async function run_on_selected(i, image) {
  // console.log(uploaded_images.files[i].name) 
  confirm("Do you prefer pLitter suggestions?")
  const model = await tf.automl.loadObjectDetection(MODEL_URL)    
  // console.log(image.width)
  // console.log(image.height)
  // console.log(image.complete)
  // console.log(image)
  const options = {score: 0.2, iou: 0.5, topk: 20};
  const predictions = await model.detect(image, options);
  console.log(predictions)
  var annotations_format = []
  predictions.forEach(prediction => {
    const {box, label, score} = prediction;
    const {left, top, width, height} = box;
    var anno_dict = {}
    anno_dict["type"] = "Annotation"
    anno_dict["body"] = []
    anno_dict_body = {}
    anno_dict_body["type"] =  "TextualBody"
    anno_dict_body["purpose"] = "tagging"
    let label_string = label.replace(/(\r\n|\n|\r)/gm,"");
    anno_dict_body["value"] = label_string
    //console.log(anno_dict_body["value"])
    anno_dict["body"].push(anno_dict_body)
    anno_dict["target"] = {}
    anno_dict["target"]["source"] = image.src,
    anno_dict["target"]["selector"] = {}
    anno_dict["target"]["selector"]["type"] = "FragmentSelector"
    anno_dict["target"]["selector"]["conformsTo"] = "http://www.w3.org/TR/media-frags/"
    anno_dict["target"]["selector"]["value"] = "xywh=pixel:"+String(left)+","+String(top)+","+String(width)+","+String(height)
    anno_dict["@context"] = ""
    anno_dict["id"] = '_' + Math.random().toString(36).substr(2, 9);
    annotations_format.push(anno_dict)
  })

  if(annotations_format.length != 0){
    selected_anno.setAnnotations(annotations_format)
  }

  //console.log(image.width)
  //console.log(image.height)

}

function labelThis(i){
  console.log(i)
  document.getElementById('osd-annoatate').innerHTML = ''
  document.getElementById("osd-annoatate-container").style.display = "";
  const image_url = URL.createObjectURL(uploaded_images.files[i])
  var viewer = OpenSeadragon({
    id: "osd-annoatate",
    prefixUrl: "./icons/openseadragon/",
    tileSources: {
      type: "image",
      url: image_url
    },
    gestureSettingsTouch: {
      pinchRotate: false
    }
  });

  selected_anno = OpenSeadragon.Annotorious(viewer, {
    locale: 'auto',
    allowEmpty: true,
    widgets: [ TagSelectorWidget ]
  });

  selected_anno.on('createSelection', async function (selection) {
    selection.body = [{
      type: 'TextualBody',
      purpose: 'tagging',
      value: 'Plastic'
    }];
    // selection.id = "#0000";
    console.log(selection);
    await selected_anno.updateSelected(selection);
    selected_anno.saveSelected();
  })

  viewer.addHandler('open', () => {
    let ignoreButton = new OpenSeadragon.Button({
      tooltip: 'Pan',
      srcRest: `./icons/openseadragon/pan-tool.png`,
      srcGroup: `./icons/openseadragon/pan-tool.png`,
      srcHover: `./icons/openseadragon/pan-tool.png`,
      srcDown: `./icons/openseadragon/pan-tool.png`,
      onClick: () => {selected_anno.setDrawingEnabled(false);},
    //   onClick: () => {console.log('ignoring'); rejectedList.push(image_id); load_random()},
    });
    viewer.addControl(ignoreButton.element, { anchor: OpenSeadragon.ControlAnchor.TOP_LEFT });
  });

  viewer.addHandler('open', () => {
    let saveButton = new OpenSeadragon.Button({
      tooltip: 'Save',
      srcRest: `./icons/openseadragon/save.png`,
      srcGroup: `./icons/openseadragon/save.png`,
      srcHover: `./icons/openseadragon/save.png`,
      srcDown: `./icons/openseadragon/save.png`,
      onClick: () => {console.log('saving'); save_annotations_to_array(i);},
    });
    viewer.addControl(saveButton.element, { anchor: OpenSeadragon.ControlAnchor.TOP_RIGHT });
  });

  viewer.addHandler('open', () => {
    let rectButton = new OpenSeadragon.Button({
      tooltip: 'Draw',
      srcRest: `./icons/openseadragon/rect.png`,
      srcGroup: `./icons/openseadragon/rect.png`,
      srcHover: `./icons/openseadragon/rect.png`,
      srcDown: `./icons/openseadragon/rect.png`,
      onClick: () => {console.log('rect'); selected_anno.setDrawingTool('rect'); selected_anno.setDrawingEnabled(true);},
    });
    viewer.addControl(rectButton.element, { anchor: OpenSeadragon.ControlAnchor.TOP_RIGHT });
  });

  const image = new Image();
  image.id = "image-dummy"
  image.onload = () => run_on_selected(i, image);
  document.getElementById("image-dummy-display").append(image)
  image.src = URL.createObjectURL(uploaded_images.files[i])
  // document.getElementById("image-dummy-display").style.display = '';

  // initialize osd-annotorius
  // img src with i
}

async function uploadThis(id){
  let image_id = NaN;
  console.log(id)
  if(images_annotations[id].length == 0){
    alert("Please add labels to the image")
  }
  else{
    let imageFormData = new FormData();
    imageFormData.append("image", uploaded_images.files[id]);
    imageFormData.append("dataset_id", upload_dataset_id);
    if(!uploaded_images.files[id].filename){
      imageFormData.append("filename", uploaded_images.files[id].filename);
    }
    if( uploaded_images_gps[id] ) {
      imageFormData.append("latitude", uploaded_images_gps[id]['lat']);
      imageFormData.append("longitude", uploaded_images_gps[id]['long']);
    }

    // axios.post(`${imageUploadbaseURL}/`, imageFormData, {
    //  headers: {
    //    "Content-Type": "multipart/form-data",
    //    "Access-Control-Allow-Origin": "*"
    //   },
    //   onUploadProgress: function(progressEvent) {
    //     var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    //     // console.log(percentCompleted)
    //    // progress_bar_${i}
    //     document.getElementById('progress_bar_'+String(id)).style.width = percentCompleted;
    //    }
    //  })
    //  .then(response => {
    //    image_id = response.data.image_id
    //    //alert(`success:${image_id}`)
    //    // let image_id = response.data.id;
    //    //console.log(image_id);

    //    if(typeof image_id === 'number'){
    //  fetch("https://annotator.ait.ac.th/api/image/?dataset_id=65", {
    fetch("https://65b9-203-159-29-51.ngrok.io/api/image/?dataset_id=65", { 
       "headers": {
         "accept": "application/json",
         "Access-Control-Allow-Origin": "*",
         "accept-language": "en-US,en;q=0.9",
         //"cache-control": "no-cache",
         //"content-type": "multipart/form-data",
         //"pragma": "no-cache",
         //"sec-gpc": "1"
      },
      "referrer": "http://203.159.29.51:5000/api/",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": imageFormData,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    })
    .then(response => response.json())
    .then(data => image_id = data.image_id)
    .then( () => {
      if(typeof image_id === 'number'){
        alert(image_id)
        // console.log(image_id);
        // }
        // })
        //.catch(error => {console.log(error)});
        //console.log("uploading annotations", image_id);
        var annotations = images_annotations[id];
        console.log(annotations);
        annotations.forEach(function(ann) {
          if(ann.target.selector.type === 'FragmentSelector'){
            var is_it_bbox = true;
            var value = ann.target.selector.value;
            var format = value.includes(':') ? value.substring(value.indexOf('=') + 1, value.indexOf(':')) : 'pixel';
            var coords = value.includes(':') ? value.substring(value.indexOf(':') + 1) : value.substring(value.indexOf('=') + 1); 
            var [ x, y, w, h ] = coords.split(',').map(parseFloat);
            var cat_name = ann.body[0].value;
            var cat_id = cat_dict[cat_name];
            //console.log(x, y, w, h, cat_id, ann.id)
            var box = [x, y, w, h];
            var seg = [[x,y,x+w,y,x+w,y+h,x,y+h]];
          }
          else if(ann.target.selector.type === "SvgSelector"){
            var is_it_bbox = false;
            //console.log("svg");
            var value = ann.target.selector.value;
            var coords = value.includes('=') ? value.substring(value.indexOf('=\"') + 3, value.indexOf('\">')) : "";
            var cat_name = ann.body[0].value;
            var cat_id = cat_dict[cat_name];
            var sep_coords = coords.split(' ');
            var flat_coords = [];
            sep_coords.forEach(sep_coord => {
              var temp_cord = sep_coord.split(',').map(i=>Number(i));
              flat_coords = flat_coords.concat(temp_cord);
            });
            var xs = [];
            var ys = [];
            for (i = 0; i < flat_coords.length; i++) {
              if(i%2 === 0){
                xs.push(flat_coords[i]);
              }
              else{
                ys.push(flat_coords[i]);
              }
            }
            var min_x = Math.min(...xs), max_x = Math.max(...xs);
            var min_y = Math.min(...ys), max_y = Math.max(...ys);
            var w = max_x-min_x;
            var h = max_y-min_y;
            var box = [min_x, min_y, w, h];
            var seg = [flat_coords];
            //console.log(xs, ys, min_x, min_y, w, h, seg, cat_id);
          }
          else{
            //console.log("type error")
            alert('Annotations Error!');
             return;
          }
	  //alert(cat_id);
          //alert(box);
          fetch("https://annotator.ait.ac.th/api/annotation/",{
	  //fetch("http://203.159.29.51:5000/api/annotation/", {
            "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json;charset=UTF-8"
            },
            "referrer": base_link+"/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify({
              image_id: image_id,
              category_id: cat_id,
              isbbox: is_it_bbox,
              segmentation: seg,
              bbox: box,
            }),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
          })
          .then(ann_response => ann_response.json())
          .then(ann_data => console.log(ann_data))
          .catch(ann_error => console.log(ann_error))
        });
        //console.log("closing foreach");
        document.getElementById("uploaded_images_"+String(id)).remove();
        $("#recenet-uploads-table").find('tbody')
        .append($(`
          <tr class="template-upload" id="recent_image_${image_id}">
            <td>
              <span class="preview"><img width="80" height="60" src="${URL.createObjectURL(uploaded_images.files[id])}"/></span>
            </td>
            <td>
              <p><span class="name">${uploaded_images.files[id].name}</span>
              <span class="size">${(uploaded_images.files[id].size/(1024*1024)).toFixed(2)} MB</span>
              <span class="size">Labels:<div>${annotations.length}</div></span></p>
            </td>
          </tr>`)
        )
      }
    })
    .catch(error => {
      alert("Failed:", error);
      alert(error);
      alert(error.message);
      alert(error.response);
    });
    // first upload the image, get the image image_id
    // then upload annotations using image_id
  }
}

function cancelThis(i){
  console.log(i)
  $('#uploaded_images_'+String(i)).remove();
}

function addFiles(){
alert("adding")
uploaded_images = document.getElementById("images");
uploaded_images_annotations = {};
uploaded_images_gps = {};
$("#uploaded_images").find('tbody').empty();
for (var i = 0; i < uploaded_images.files.length; i++) {
  //console.log(i)
  if(!uploaded_images.files[i].filename){
    uploaded_images.files[i].filename = uuid()+'.jpg';
  }
  images_annotations[i] = []
  // console.log(uploaded_images.files[i].name)
  $("#uploaded_images").find('tbody')
    .append($(`
      <tr class="" id="uploaded_images_${i}">
        <td>
          <span class="preview"><img id="uploaded_image_${i}" width="80" height="60" src="${URL.createObjectURL(uploaded_images.files[i])}"/></span>
        </td>
        <td>
          <span class="name">File name: ${uploaded_images.files[i].name}</span>
          <span class="size">Size: ${(uploaded_images.files[i].size/(1024*1024)).toFixed(2)} MB</span>
          <span id="uploaded_images_${i}_gps">GPS coordinates: ${getExif(i) }</span>
          <span class="size">Labels:<div style="inline" id="labelcount_${i}">0</div></span>
          <div class="progress progress-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="progress_bar_${i}" class="progress-bar progress-bar-success" style="width:0%;"></div></div>
        </td>
        <td>
          <button class="btn btn-primary edit" data-index="0" onclick="labelThis(${i})">
            <i class="fa fa-edit"></i>
            <span>Label</span>
          </button>
          <button class="btn btn-success start" onclick="uploadThis(${i})">
            <i class="fa fa-upload"></i>
            <span>Upload</span>
          </button>
          <button class="btn btn-danger delete" onclick="cancelThis(${i})">
            <i class="fa fa-trash-alt"></i>
            <span>Delete</span>
          </button>
        </td>
      </tr>`)
    )  
}
}

function ConvertDMSToDD(latitude, latitudeRef, longitude, longitudeRef) {

const latitudeMultiplier = latitudeRef == 'N' ? 1 : -1;
const decimalLatitude = latitudeMultiplier * piexif.GPSHelper.dmsRationalToDeg(latitude);
const longitudeMultiplier = longitudeRef == 'E' ? 1 : -1;
const decimalLongitude = longitudeMultiplier * piexif.GPSHelper.dmsRationalToDeg(longitude);

const latitudeDegrees = piexif.GPSHelper.dmsRationalToDeg(latitude);
const longitudeDegrees = piexif.GPSHelper.dmsRationalToDeg(longitude);
return {'lat':latitudeDegrees, 'latRef': latitudeRef, 'lon': longitudeDegrees, 'lonRef': longitudeRef}
}

async function getExif(i) {
file = uploaded_images.files[i]
var reader = new FileReader();
reader.onload = await function(e) {
  var exif = piexif.load(this.result)
  var latitude = exif['GPS'][piexif.GPSIFD.GPSLatitude];
  var latitudeRef = exif['GPS'][piexif.GPSIFD.GPSLatitudeRef];
  var longitude = exif['GPS'][piexif.GPSIFD.GPSLongitude];
  var longitudeRef = exif['GPS'][piexif.GPSIFD.GPSLongitudeRef];
  if (latitude   && latitudeRef && longitude && longitudeRef) {
    var image_gps = ConvertDMSToDD(latitude, latitudeRef, longitude, longitudeRef);
    uploaded_images_gps[i] = {"lat": image_gps['lat'], "long": image_gps['lon']}
    document.getElementById("uploaded_images_"+String(i)+"_gps").innerHTML = image_gps['lat']+' '+image_gps['latRef']+','+image_gps['lon']+' '+image_gps['lonRef']
  }
  else {
    if(navigator.geolocation){
        document.getElementById("geop").innerHTML = 'laliga';
	navigator.geolocation.getCurrentPosition(function(position){
	  document.getElementById("geop").innerHTML = position.coords.latitude;
	}, function(error){
	  document.getElementById("geop").innerHTML = error.code;
	});
	//alert(navigator.geolocation.watchPosition(onGeoSuccess));
    }
    else { 
	document.getElementById('geop').innerHTML = 'loliga';
    }
    navigator.geolocation.getCurrentPosition(function(position){
      uploaded_images_gps[i] = {"lat": position.coords.latitude, "long": position.coords.longitude};
      document.getElementById("uploaded_images_"+String(i)+"_gps").innerHTML = position.coords.latitude+','+position.coords.longitude;
    }, function(error){
      alert("wow no geo");
      uploaded_images_gps[i] = {"lat": null, "long": null};
      document.getElementById("uploaded_images_"+String(i)+"_gps").innerHTML = "Geolocation not found!";
    }, {enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
  }
}
reader.readAsBinaryString(file);
}
// </script>
