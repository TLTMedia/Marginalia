<?php

/* upload.htm */
class __TwigTemplate_98e67de79a191687efe1c3154bc12e193bdecfce442914c8afffa8f393b8f398 extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        // line 1
        echo "<div id=\"addedLitBase\">
    <div id=\"fileSystemTitle\">File Input System</div>

    <div class=\"tempNameContainer\" style=\"margin-top:10px;\"></div>
    <div class=\"nameContainer\">
        <span>Name of Text: </span>
        <div class=\"mdl-textfield mdl-js-textfield is-upgraded\">
            <input id=\"addNameInput\" class=\"mdl-textfield__input\" type=\"text\" maxlength=\"20\">
            <label class=\"mdl-textfield__label\" for=\"addNameInput\"></label>
        </div>
    </div>

    <div class=\"fileContainer\">
        <span id=\"fileTitle\">Choose Your File: </span>
        <br>
        <label id=\"addFileButton\" class=\"input-custom-file mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored\">
            Choose
            <input type=\"file\" accept=\".docx\">
        </label>
        <span id=\"fileName\">*.docx</span>
    </div>

    <div class=\"privateContainer\">
        <label id=\"privateCheck\" class=\"mdl-checkbox mdl-js-checkbox is-upgraded\" for=\"privateChk\">
            <input type=\"checkbox\" id=\"privateChk\" class=\"mdl-checkbox__input mdl-js-ripple-effect\">
            <span class=\"mdl-checkbox__label\">Page is Private</span>
            <span class=\"mdl-checkbox__focus-helper\"></span>
            <span class=\"mdl-checkbox__box-outline\">
                <span class=\"mdl-checkbox__tick-outline\"></span>
            </span>
        </label>
    </div>

    <label id=\"addUploadButton\" class=\"mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored\">
        Upload
    </label>

    <br>
    <div id=\"goBack\" style=\"margin-bottom:0px\">
        <button class=\"mdl-button mdl-js-button mdl-button--icon\">
            <span class=\"material-icons\">arrow_back</span>
        </button>
        Go Back
    </div>
</div>
";
    }

    public function getTemplateName()
    {
        return "upload.htm";
    }

    public function getDebugInfo()
    {
        return array (  19 => 1,);
    }

    /** @deprecated since 1.27 (to be removed in 2.0). Use getSourceContext() instead */
    public function getSource()
    {
        @trigger_error('The '.__METHOD__.' method is deprecated since version 1.27 and will be removed in 2.0. Use getSourceContext() instead.', E_USER_DEPRECATED);

        return $this->getSourceContext()->getCode();
    }

    public function getSourceContext()
    {
        return new Twig_Source("", "upload.htm", "/home1/tltsecure/apache2/htdocs/slim/tmp/templates/upload.htm");
    }
}
