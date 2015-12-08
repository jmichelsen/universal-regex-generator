var regexGenerator = {
    wrapSelection: wrapSelection,
    getRegexPieces: getRegexPieces,
    createRegex: createRegex
};

function wrapSelection(type) {
    var range;

    if ( typeof window.getSelection != 'undefined' ) {
        var selection = window.getSelection();

        if ( selection.rangeCount ) {
            var $container = $(document.createElement('span')).addClass(type).wrap('div');

            for ( var i = 0; i < selection.rangeCount; i++ ) {
                $container.append(selection.getRangeAt(i).cloneContents());
            }
        }
    }
    range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode($container[0]);
}

function getRegexPieces(messageContainer) {
    var regexPieces = [];

    var pushNode = function(type, contents) {
        regexPieces.push({'type': type, 'value': contents});
    };

    messageContainer.find('span').first().contents().each(function() {
        if ( this.nodeType === Node.TEXT_NODE ) {
            if ( this.nodeValue ) {
                pushNode("invariant", this.nodeValue);
            }
        } else {
            pushNode($(this).attr('class'), $(this).contents()[0].nodeValue);
        }
    });
    return JSON.stringify(regexPieces);
}

function createRegex(regexPieces) {
    regexPieces = JSON.parse(regexPieces.replace(/'/g, '"'));

    var REGEX_GENERATOR_INVARIANT = 'invariant',
        REGEX_GENERATOR_NUMBER = 'number',
        REGEX_GENERATOR_NUMBER_FIXED = 'number_fixed',
        REGEX_GENERATOR_VARIABLE = 'variable';

    var regexGeneratorValues = {};

    regexGeneratorValues[REGEX_GENERATOR_INVARIANT] = '{}';
    regexGeneratorValues[REGEX_GENERATOR_NUMBER] = '(\d+)';
    regexGeneratorValues[REGEX_GENERATOR_NUMBER_FIXED] = '(\d{{}})';
    regexGeneratorValues[REGEX_GENERATOR_VARIABLE] = '(.+)';

    var regexValue,
        regexType,
        regexChar,
        regexBuilder = '',
        parsedMessage = '',
        result = {};

    for ( var i = 0; i < regexPieces.length; i++ ) {
        regexType = regexPieces[i].type;

        if ( !regexType ) {
            console.error('no regex type')
        }
        regexValue = regexType !== REGEX_GENERATOR_NUMBER_FIXED ? regexPieces[i].value.replace(/(_|\W)/g, '\\$1') : regexPieces[i].value.length;
        regexChar = regexGeneratorValues[regexType];
        regexBuilder += regexChar.format(regexValue);
        parsedMessage += regexPieces[i].value;

        result['message'] = parsedMessage;
        result['regex'] = regexBuilder;
        result['regex_pieces'] = regexPieces;
    }

    return result;
}

String.prototype.format = function() {
    var i = 0,
        args = arguments;

    return this.replace(/{}/g, function() {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};
