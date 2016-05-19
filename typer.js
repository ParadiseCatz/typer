var Word = Backbone.Model.extend({
	move: function() {
		this.set({y:this.get('y') + this.get('speed')});
	}
});

var Words = Backbone.Collection.extend({
	model:Word
});

var WordView = Backbone.View.extend({
	initialize: function() {
		var string = this.model.get('string');
		var letter_width = 25;
		var word_width = string.length * letter_width;
		$(this.el).css({
			position:'absolute',
			overflow:'auto',
			'width':word_width
		});
		if(this.model.get('x') + word_width > $(window).width()) {
			this.model.set({x:$(window).width() - word_width});
		}
		for(var i = 0;i < string.length;i++) {
			$(this.el)
				.append($('<div>')
					.css({
						width:letter_width + 'px',
						padding:'5px 2px',
						'border-radius':'4px',
						'background-color':'#fff',
						border:'1px solid #ccc',
						'text-align':'center',
						float:'left'
					})
					.text(string.charAt(i).toUpperCase()));
		}
		
		this.listenTo(this.model, 'remove', this.remove);
		
		this.render();
	},
	
	render:function() {
		$(this.el).css({
			top:this.model.get('y') + 'px',
			left:this.model.get('x') + 'px'
		});
		var highlight = this.model.get('highlight');
		$(this.el).find('div').each(function(index,element) {
			if(index < highlight) {
				$(element).css({'font-weight':'bolder','background-color':'#aaa',color:'#fff'});
			} else {
				$(element).css({'font-weight':'normal','background-color':'#fff',color:'#000'});
			}
		});
	}
});

var PlayView = Backbone.View.extend({
	initialize: function() {
		$(this.el)
			.addClass('btn btn-default')
			.attr('type', 'button')
			.append($('<span>')
				.addClass('glyphicon glyphicon-play')
				.css({
					'aria-hidden':'true',
					'margin-right':'6px'
				})
			)
			.append($('<span>')
				.attr('id', 'play-button')
				.text('Play'));
		this.listenTo(this.model, 'resetPlayButton', this.reset);
	},
	events: {
		"click": "clickEvent"
	},
	clickEvent: function() {
		if (this.model.get('iterate_interval_id') == undefined) {
			$(this.el).find('.glyphicon-play').switchClass('glyphicon-play', 'glyphicon-pause');
			$(this.el).find('#play-button').text('Pause');
			this.model.start();
		} else {
			if (!this.model.get('is_paused')) {
				$(this.el).find('.glyphicon-pause').switchClass('glyphicon-pause', 'glyphicon-play');
				$(this.el).find('#play-button').text('Resume');
				this.model.pause();
			} else {
				$(this.el).find('.glyphicon-play').switchClass('glyphicon-play', 'glyphicon-pause');
				$(this.el).find('#play-button').text('Pause');
				this.model.resume();
			}
		}
	},
	reset: function() {
		$(this.el).find('.glyphicon-pause').switchClass('glyphicon-pause', 'glyphicon-play');
		$(this.el).find('#play-button').text('Play');
	}
});

var StopView = Backbone.View.extend({
	initialize: function() {
		$(this.el)
			.addClass('btn btn-default')
			.attr('type', 'button')
			.append($('<span>')
				.addClass('glyphicon glyphicon-stop')
				.css({
					'aria-hidden':'true',
					'margin-right':'6px'
				})
			)
			.append('Stop');
	},
	events: {
		"click": "clickEvent"
	},
	clickEvent: function() {
		this.model.trigger('resetPlayButton');
		this.model.stop();
	}
});

var TyperView = Backbone.View.extend({
	initialize: function() {
		var wrapper = $('<div>')
			.css({
				position:'fixed',
				top:'0',
				left:'0',
				width:'100%',
				height:'100%'
			});
		this.wrapper = wrapper;
		
		var self = this;
		var text_input = $('<input>')
			.addClass('form-control')
			.keyup(function() {
				var words = self.model.get('words');
				for(var i = 0;i < words.length;i++) {
					var word = words.at(i);
					var typed_string = $(this).val();
					var string = word.get('string');
					if(string.toLowerCase().indexOf(typed_string.toLowerCase()) == 0) {
						word.set({highlight:typed_string.length});
						if(typed_string.length == string.length) {
							$(this).val('');
						}
					} else {
						if (word.get('highlight')) {
							self.model.get('scorer').decreasePoint();
						}
						word.set({highlight:0});
					}
				}
			});
		var play_button = $('<button>');
		var play_reset = undefined;
		this.model.set({play_reset:play_reset});

		new PlayView({
			model: this.model,
			el: play_button
		});

		var stop_button = $('<button>');
		new StopView({
			model: this.model,
			el: stop_button,
			play_reset: play_reset
		});

		var text_input_group = $('<div>')
			.addClass('input-group')
			.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'0',
				'min-width':'80%',
				width:'80%',
				'margin-bottom':'10px',
				'z-index':'1000'
			})
			.append($('<div>')
				.addClass('input-group-btn')
				.append(play_button)
				.append(stop_button)
			)
			.append(text_input);
		$(this.el)
			.append(wrapper
				.append($('<form>')
					.attr({
						role:'form'
					})
					.submit(function() {
						return false;
					})
					.append(text_input_group)));
		
		text_input_group.css({left:((wrapper.width() - text_input.width()) / 2) + 'px'});
		text_input.focus();
		
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		var model = this.model;
		var words = model.get('words');
		
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			if(!word.get('view')) {
				var word_view_wrapper = $('<div>');
				this.wrapper.append(word_view_wrapper);
				word.set({
					view:new WordView({
						model: word,
						el: word_view_wrapper
					})
				});
			} else {
				word.get('view').render();
			}
		}
	}
});

var ScorerView = Backbone.View.extend({
	initialize: function() {
		$(this.el)
			.append($('<div>')
				.attr('id', 'score')
				.addClass('bg-primary img-rounded')
				.css({
					width:'100px',
					margin:'10px',
					padding:'5px'
				})
			);
		this.listenTo(this.model, 'change', this.render);
		this.render();
	},
	render: function() {
		$(this.el).find('#score').text('Score: ' + this.model.get('score'));
	}
});

var Scorer = Backbone.Model.extend({
	defaults:{
		score:0
	},
	increasePoint: function() {
		var increase_constant = 10;
		this.set({score:this.get('score') + increase_constant});
		this.trigger('change');
	},
	decreasePoint: function() {
		var decrease_constant = 3;
		this.set({score:this.get('score') - decrease_constant});
		this.trigger('change');
	}
});

var Typer = Backbone.Model.extend({
	defaults:{
		max_num_words:10,
		min_distance_between_words:50,
		words:new Words(),
		min_speed:1,
		max_speed:5,
		iterate_interval_id:undefined,
		is_paused:false,
		scorer:new Scorer()
	},
	
	initialize: function() {
		new TyperView({
			model: this,
			el: $(document.body)
		});
		new ScorerView({
			model: this.get('scorer'),
			el: $(document.body)
		})
	},

	start: function() {
		if (this.get('iterate_interval_id') != undefined) {
			return;
		}
		var animation_delay = 25;
		var self = this;
		this.set({is_paused:false});
		this.set('iterate_interval_id', setInterval(function() {
			self.iterate();
		},animation_delay));
	},

	stop: function() {
		if (this.get('iterate_interval_id') == undefined) {
			return;
		}
		var words = this.get('words');
		for(var i = 0;i < words.length;) {
			words.remove(words.at(i));
		}
		this.trigger('change');
		clearInterval(this.get('iterate_interval_id'));
		this.set({iterate_interval_id:undefined});
	},

	pause: function() {
		this.set({is_paused:true});
	},
	resume: function() {
		this.set({is_paused:false});
	},
	
	iterate: function() {
		if (this.get('is_paused')) {
			return;
		}
		var words = this.get('words');
		if(words.length < this.get('max_num_words')) {
			var top_most_word = undefined;
			for(var i = 0;i < words.length;i++) {
				var word = words.at(i);
				if(!top_most_word) {
					top_most_word = word;
				} else if(word.get('y') < top_most_word.get('y')) {
					top_most_word = word;
				}
			}
			
			if(!top_most_word || top_most_word.get('y') > this.get('min_distance_between_words')) {
				var random_company_name_index = this.random_number_from_interval(0,company_names.length - 1);
				var string = company_names[random_company_name_index];
				var filtered_string = '';
				for(var j = 0;j < string.length;j++) {
					if(/^[a-zA-Z()]+$/.test(string.charAt(j))) {
						filtered_string += string.charAt(j);
					}
				}
				
				var speed_modifier = 4;
				var word = new Word({
					x:this.random_number_from_interval(0,$(window).width()),
					y:0,
					string:filtered_string,
					speed:this.random_number_from_interval(this.get('min_speed'),this.get('max_speed')) / speed_modifier
				});
				words.add(word);
			}
		}
		
		var words_to_be_removed = [];
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			word.move();
			
			if(word.get('y') > $(window).height() || word.get('move_next_iteration')) {
				words_to_be_removed.push(word);
			}
			
			if(word.get('highlight') && word.get('string').length == word.get('highlight') && !word.get('move_next_iteration')) {
				this.get('scorer').increasePoint();
				word.set({move_next_iteration:true});
			}
		}
		
		for(var i = 0;i < words_to_be_removed.length;i++) {
			words.remove(words_to_be_removed[i]);
		}
		
		this.trigger('change');
	},
	
	random_number_from_interval: function(min,max) {
	    return Math.floor(Math.random()*(max-min+1)+min);
	}
});