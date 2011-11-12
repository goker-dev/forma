(function( $ ){
    var s;
    // Methods
    var m = {
        init: function(form){
            // SELECTBOX, CHECKBOX, RADIO BUTTON CUSTOMIZER
            form.find('select[class!=forma], textarea[class!=forma], input[type=checkbox][class!=forma], input[type=radio][class!=forma]')
            .each(function(){
                var i = $(this).addClass('forma');
                
                var type = this.type == 'radio' ? 'radio' 
                : (this.type == 'checkbox' ? 'checkbox' 
                : (this.type == 'textarea' ? 'textarea' : 'select'));
                type = type == 'checkbox' ? ( i.hasClass('switch') ? 'switch' : 'checkbox') : type;
                $('<p class="'+ type +'">')
                .append($('<span>').html(i.find('option:selected').html()))
                .insertAfter(i).append(i/*,i.parent().find('div')*/);
                $(':checked').parent().addClass('checked');
                i.bind('mouseover',(function(){
                    i.parent().addClass('focus');
                }))
                .focus(function(){
                    i.parent().addClass('focus');
                })
                .bind('mouseout',(function(){
                    if(i.is(':focus')) return;
                    i.parent().removeClass('focus');
                }))
                .blur(function(){
                    i.parent().removeClass('focus');
                });
                
                i.parent().parent().mouseover(function(){
                    $(this).find('p').addClass('focus');
                });
                i.parent().parent().mouseout(function(){
                    if(i.is(':focus')) return;
                    $(this).find('p').removeClass('focus');
                });
                i.click(function(){
                    $(':not(:checked)').parent().removeClass('checked');
                    $(':checked').parent().addClass('checked');
                })
                .change(function(){
                    $(this).prev()
                    .html($(this).find('option:selected').html());
                });
            });
            // FILE
            form.find('input[type=file][class!=droparea]')
            .each(function(){
                var area = $('<p class="file">')
                    .insertAfter($(this)).append($(this));
                
                $('<b>').html($(this).attr('title')).prependTo(area);
                s.info = $('<b class="info">').prependTo(area);
                s.progress = $('<b class="progress">').prependTo(area);
                
                $(this).change(function(e){
                    m.traverse(e.target.files, $(this), area);
                });
            });
            // BUTTON, SUBMIT CUSTOMIZER
            form.find('button, input[type=submit]')
            .mousedown(function(){
                $(this).addClass('down');
            }).mouseup(function(){
                $(this).removeClass('down');
            });
            // SUBMIT
            form.submit(function(e){
                e.preventDefault();
                form.find('i.error, i.success').fadeOut();
                form.find('.error').removeClass('error');
                form.find('input[type=submit]').attr('disabled','disabled');
                form.find('.loader').css('display','inline-block');
                $.ajax({
                    url: s.prefix + form.attr('action') + s.suffix,
                    type: 'post',
                    data: form.serialize() + '&' + s.data,
                    dataType: s.dataType,
                    success: function(r){
                        s.complete(form,r);
                    }
                });                
            });
            return false;
        },
        traverse: function(files, input, area){
            s.files = files.length;
            if (typeof files !== "undefined") {
                for (var i=0, l=files.length; i<l; i++) {
                    m.control(files[i], input, area);
                }
            } else {
                alert('un supported file!');
            }
        },
        control: function(file, input, area){
            var item = $('<u class="attachment">').html(file.name)
                        .insertAfter(area);
            // File type control
            var tld = file.name.toLowerCase().split(/\./);
            tld = tld[tld.length -1];
            //console.log(input.data('type').indexOf(tld),tld,input.data('type'));
            if (input.data('type') && input.data('type').indexOf(tld) < 0) {
                $('<i class="error">')
                .html('error, you can upload only "' + input.data('type') + '" files.')
                .insertAfter(item);
                return 0;
            }
            // File size control
            if (file.size > (s.maxsize * 1048576)) {
                $('<i class="error">')
                .html('error, max upload size: ' + s.maxsize + 'Mb')
                .insertAfter(item);
                return 0;
            }
            m.upload(file, input, area);
        },
        upload: function(file, input, area){
            s.info.html((++s.counter)+'/'+s.files)
            //area.empty();
            /*s.progress = $('<div>',{
                'class':'progress'
            });
            area.append(progress);*/
			
            // Uploading - for Firefox, Google Chrome and Safari
            var xhr = new XMLHttpRequest();
            // Update progress bar
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    var loaded = Math.ceil((e.loaded / e.total) * 100) + "%";
                    s.progress.css('width',loaded);
                }
            }, false);
			
            // File uploaded
            xhr.addEventListener("load", function (e) {
                var result = jQuery.parseJSON(e.target.responseText);
                
                // Calling complete function
                //s.complete = input.data('complete') || s.complete;
                eval(input.data('complete'));
                
                s.progress.css('width',0);
            }, false);
            xhr.open("post", input.data('post'), true);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            // Create a new formdata
            var fd = new FormData();
            
            // Add optional form data
            for (var i in input.data())
                if (typeof input.data(i) !== "object")
                    fd.append(i, input.data(i));

            // Add file data
            fd.append(input.attr('name'), file);

            // Send data
            xhr.send(fd);
        },
        result: function(form,r){
            if(r.fields){
                var f = typeof r.fields === 'object' ? r.fields : r.fields.split(/,/);
                for(var i in f){
                    form.find('[name='+f[i]+']').addClass('error');
                }
            }
            if(r.message) 
            form.find('label:has(input[type=submit])')
                .before($('<i class="'+(r.code != 200 ? 'error' : 'success')+'">')
                .html(r.message));
        },
        // Default complete function
        complete: function(form,r){
            form.find('input[type=submit]').removeAttr('disabled');
            form.find('.loader').css('display','none');
            //if(r.code != 200) 
                m.result(form, r);
            if(r.redirect) location.href = r.redirect;
            eval(form.data('complete'));
            return 0;
        }
    };
    $.fn.forma = function(o) {
        // Settings
        s = $.extend({
            files     : 0,
            counter   : 0,
            progress  : $('<b>'),
            info      : $('<b>'),
            prefix    : '',
            suffix    : '',
            dataType  : 'json',
            data      : 'js=1',
            valuelabel: 0,
            complete  : m.complete,
            maxsize   : 10 //Mb
        }, s);
        if(o) $.extend(s, o);
        this.each(function(){
            m.init($(this));
        });
    };
})( jQuery );