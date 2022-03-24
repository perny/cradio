export function thisTypeOf(param) {
  return Object.prototype.toString.call(param);
}
export function timeStyle(value) {
  var result = parseInt(value);
  var h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600);
  var m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
  var s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));
  var res = '';
  if (h !== '00') {
    res = h + ':';
  }
  res += m + ':';
  res += s;
  return res;
}

export function createDom(str) {
  var ele = document.createElement('div');
  ele.className = str.substring(1);
  return ele;
}

export function dom(str) {
  return document.querySelector(str);
}

export function isIE() {
  return navigator.userAgent.indexOf('Trident') > 0;
}

export function isiPhone() {
  return (navigator.userAgent.indexOf('iPhone') > 0 || navigator.userAgent.indexOf('iPad') > 0) && navigator.userAgent.indexOf('Safari');
}

export function prepend (A, B) {
  if (A.firstChild) {
    A.insertBefore(B, A.firstChild);
  } else {
    A.appendChild(B);
  }
}
